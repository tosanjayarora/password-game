import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import Profanity from "profanity-js";
import { ChatServiceMethod, ChatMessage, ChatDeletionCommand } from "@pwdgame/shared";
import { v4 as uuid } from "uuid";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<any> {
    const messageId = req.body?.messageId;

    if (!messageId) {
        context.res = {
            status: 400,
            body: "Invalid chat message arguments"
        };
        return;
    }

    context.res = {
        status: 201
    };

    const arg: ChatDeletionCommand = { messageId };

    return {
        target: ChatServiceMethod.DeleteMessage,
        arguments: [arg]
    };
};

export default httpTrigger;