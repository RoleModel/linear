import fs from "fs";
import { Comment, Importer, ImportResult, Estimate, Project, Status } from "../../types";

type TrelloLabelColor = "green" | "yellow" | "orange" | "red" | "purple" | "blue" | "sky" | "lime" | "pink" | "black";
type TrelloModelType = "card" | "board";

interface TrelloCustomFieldItem {
  id: string;
  value: null;
  idValue: string;
  idCustomField: string;
  idModel: string;
  modelType: TrelloModelType;
}

interface TrelloCustomFieldOption {
  id: string;
  idCustomField: string;
  value: { text: string };
  color: TrelloLabelColor;
  pos: number;
}

interface TrelloCustomField {
  id: string;
  idModel: string;
  modelType: TrelloModelType;
  fieldGroup: string;
  display: { cardFront: boolean };
  name: string;
  pos: number;
  options: TrelloCustomFieldOption[];
  type: "list" | "text" | "number" | "date";
  isSuggestedField: boolean;
}

interface TrelloCard {
  name: string;
  desc: string;
  url: string;
  shortUrl: string;
  closed: boolean;
  labels: {
    id: string;
    idBoard: string;
    name: string;
    color: TrelloLabelColor;
  }[];
  attachments: {
    name: string;
    url: string;
  }[];
  id: string;
  idList: string;
  customFieldItems: TrelloCustomFieldItem[];
}

interface TrelloChecklist {
  id: string;
  idCard: string;
  checkItems: {
    name: string;
    state: "incomplete" | "complete";
    pos: number;
  }[];
}

interface TrelloComment {
  text: string;
  card: { id: string };
}

interface TrelloCommentAction {
  type: "commentCard";
  memberCreator?: { id: string; fullName: string; avatarUrl: string };
  data: TrelloComment;
  date: string;
}

interface TrelloList {
  name: string;
  id: string;
  closed: boolean;
  color: null;
  idBoard: string;
  pos: number;
  subscribed: boolean;
  softLimit: null;
  creationMethod: null;
  idOrganization: string;
  limits: {
    cards: {
      openPerList: {
        status: string;
        disableAt: number;
        warnAt: number;
      };
      totalPerList: {
        status: string;
        disableAt: number;
        warnAt: number;
      };
    };
  };
  nodeId: string;
}

const ESTIMATE_MAP = {
  "X-Small (< 2hrs)": Estimate.XS,
  "Small (< day)": Estimate.S,
  "Medium (~day)": Estimate.M,
  "Large (~2 days)": Estimate.L,
  "X-Large (~1 wk)": Estimate.XL,
  "Too large! (> 1 wk)": Estimate.Empty,
};

const PROJECT_MAP = {
  Kombi: Project.KOMBI,
  "Moddex Ezibilt": Project.MODDEX,
  "Leveled Platforms": Project.LEVELED_PLATFORMS,
};

const STATUS_MAP = {
  // Backlog
  Icebox: Status.BACKLOG,
  Reference: Status.BACKLOG,
  "Product Backlog": Status.BACKLOG,
  "Release Backlog": Status.BACKLOG,
  "Leveled Platform Backlog": Status.BACKLOG,
  // Todo
  "Awaiting Feedback": Status.TODO,
  Moddex: Status.TODO,
  "Bugs, Issues, Discussion": Status.TODO,
  "Moddex Platforms Phase 2": Status.TODO,
  "Leveled Platforms Workshop Drawing": Status.TODO,
  "This Iteration": Status.TODO,
  // In Progress
  "In Progress": Status.IN_PROGRESS,
  // Review
  "Code Review": Status.IN_REVIEW,
  // Customer Review
  "Deploy to Staging": Status.CUSTOMER_REVIEW,
  "Customer Review/Approve": Status.CUSTOMER_REVIEW,
  "Deploy to Production": Status.CUSTOMER_REVIEW,
  // Done
  "Iteration Meeting": Status.DONE,
  "Q1 2024": Status.DONE,
  "Q4 2023": Status.DONE,
  "Q3 2023": Status.DONE,
  "Q2 2023": Status.DONE,
  "Q1 2023": Status.DONE,
  "Q4 2022": Status.DONE,
  "Done Not Deployable": Status.DONE,
};

export class TrelloJsonImporter implements Importer {
  public constructor(filePath: string, discardArchivedCards: boolean, discardArchivedLists: boolean) {
    this.filePath = filePath;
    this.discardArchivedCards = discardArchivedCards;
    this.discardArchivedLists = discardArchivedLists;
  }

  public get name(): string {
    return "Trello (JSON)";
  }

  public get defaultTeamName(): string {
    return "Trello";
  }

  public import = async (): Promise<ImportResult> => {
    const bytes = fs.readFileSync(this.filePath);
    const data = JSON.parse(bytes as unknown as string);

    const importData: ImportResult = {
      issues: [],
      labels: {},
      users: {},
      statuses: {},
      subIssues: {},
    };

    // Map card id => checklist so we can add them to the issues in the next step
    const checkLists: { [key: string]: TrelloChecklist } = {};
    const trelloCheckLists: { [key: string]: string[] } = {};

    const urlsToIds: { [key: string]: string } = {};
    data.cards.forEach((card: TrelloCard) => {
      urlsToIds[card.url] = card.id;
      urlsToIds[card.shortUrl] = card.id;
    });

    const customFields = {};
    data.customFields.forEach((field: TrelloCustomField) => {
      customFields[field.id] = {
        name: field.name,
        type: field.type,
      };
      field.options?.forEach(option => {
        customFields[field.id][option.id] = option.value.text;
      });
    });

    const lists = {};
    data.lists.forEach((list: TrelloList) => {
      lists[list.id] = list.name;
    });

    for (const checklist of data.checklists as TrelloChecklist[]) {
      checkLists[checklist.idCard] = checklist;
      checklist.checkItems.forEach(item => {
        if (item.name.includes("trello.com")) {
          trelloCheckLists[checklist.idCard] ||= [];
          const cardId: string = urlsToIds[item.name];
          if (cardId) {
            trelloCheckLists[checklist.idCard].push(cardId);
          }
        }
      });
    }

    // Map card id => comments so we can add them to the issues in the next step
    const comments: { [key: string]: Comment[] } = {};
    for (const action of data.actions) {
      if (action.type !== "commentCard") {
        continue;
      }
      const {
        data: { text, card },
        memberCreator,
        date,
      } = action as TrelloCommentAction;

      // Handle comment creator does not exist in import
      if (!memberCreator) {
        continue;
      }

      importData.users[memberCreator.id] = { name: memberCreator.fullName, avatarUrl: memberCreator.avatarUrl };
      const importComment = { body: text, userId: memberCreator.id, createdAt: new Date(date) };
      if (card.id in comments) {
        comments[card.id].push(importComment);
      } else {
        comments[card.id] = [importComment];
      }
    }

    for (const card of data.cards as TrelloCard[]) {
      const url = card.shortUrl;
      const mdDesc = card.desc;

      // CHECKLIST
      const checklist = checkLists[card.id];
      let formattedChecklist = "";
      if (checklist) {
        formattedChecklist = checklist.checkItems
          .filter(item => !urlsToIds[item.name])
          .sort((item1, item2) => item1.pos - item2.pos)
          .map(item => `- [${item.state === "complete" ? "x" : " "}] ${item.name}`)
          .join("\n");
      }

      // ATTACHMENTS
      const formattedAttachments = card.attachments
        .map(attachment => `[${attachment.name}](${attachment.url})`)
        .join("\n");

      // ESTIMATE
      let estimate = Estimate.NoEstimate;
      let projectId = Project.KOMBI;
      card.customFieldItems.forEach(field => {
        const customField = customFields[field.idCustomField];
        const name = customField.name;
        if (name === "Estimate") {
          const value = customField[field.idValue];
          estimate = ESTIMATE_MAP[value];
          return;
        }

        if (name === "App") {
          const value = customField[field.idValue];
          projectId = PROJECT_MAP[value];
          return;
        }
      });

      const status = STATUS_MAP[lists[card.idList]];

      // https://linear.app/rolemodelsoftware/project/kombi-e0eb1c52c4bc
      // https://linear.app/rolemodelsoftware/issue/SAY-107/eb-balustrade-offset-handrail

      // DESCRIPTION
      const description = `${mdDesc}${formattedChecklist && `\n${formattedChecklist}`}${
        formattedAttachments && `\n\nAttachments:\n${formattedAttachments}`
      }\n\n[View original card in Trello](${url})`;
      const labels = card.labels.map(l => l.id);

      if (this.discardArchivedCards && card.closed) {
        continue;
      }

      if (
        this.discardArchivedLists &&
        (data.lists as TrelloList[]).find(list => list.id === card.idList && list.closed)
      ) {
        continue;
      }

      importData.issues.push({
        title: card.name,
        description,
        url,
        labels,
        comments: comments[card.id],
        originalId: card.id,
        estimate,
        projectId,
        status,
      });

      const allLabels = card.labels.map(label => ({
        id: label.id,
        color: mapLabelColor(label.color),
        // Trello allows labels with no name and only a color value, but we must specify a name
        name: label.name || `Trello-${label.color}`,
      }));

      for (const label of allLabels) {
        const { id, ...labelData } = label;
        importData.labels[id] = labelData;
      }
    }
    importData.subIssues = trelloCheckLists;

    return importData;
  };

  // -- Private interface
  private filePath: string;
  private discardArchivedCards: boolean;
  private discardArchivedLists: boolean;
}

// Maps Trello colors to Linear branded colors
const mapLabelColor = (color: TrelloLabelColor): string => {
  const colorMap = {
    green: "#0F783C",
    yellow: "#F2C94C",
    orange: "#DB6E1F",
    red: "#C52828",
    purple: "#5E6AD2",
    blue: "#0F7488",
    sky: "#26B5CE",
    lime: "#4CB782",
    pink: "#EB5757",
    black: "#ffffff", // black is the new white ¯\_(ツ)_/¯
  };
  return colorMap[color];
};
