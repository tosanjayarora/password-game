import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import Profanity from "profanity-js";
import { ChatServiceMethod, ChatMessage } from "@pwdgame/shared";
import { v4 as uuid } from "uuid";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<any> {
    const message = req.body?.message;

    if (!isValidChatMessage(message)) {
        context.res = {
            status: 400,
            body: "Invalid chat message arguments"
        };
        return;
    }

    const profanity = new Profanity('', { language: 'en-us' })
    if (profanity.isProfane(message.message)) {
        context.res = {
            status: 409,
            body: "Message contains banned words"
        };
        return;
    }

    context.res = {
        status: 201
    };

    const arg: ChatMessage = { messageId: uuid(), ...message };

    return {
        target: ChatServiceMethod.SendMessage,
        arguments: [arg]
    };
};

const isValidChatMessage = (message: any): message is Omit<ChatMessage, "messageId"> => {
    return message && message
        && typeof message.message === "string"
        && typeof message.username === "string";
}

export default httpTrigger;