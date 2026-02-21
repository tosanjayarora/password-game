import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { ChatDeletionCommand, ChatMessage } from "../models/Chat";
import { v4 as uuid } from "uuid";

export enum ChatServiceMethod {
    SendMessage = "send",
    DeleteMessage = "delete"
}

export type ChatMessageListener = (message: ChatMessage) => void;

export type ChatDeletionListener = (command: ChatDeletionCommand) => void;

export type ChatListener =
    { method: ChatServiceMethod.SendMessage, listener: ChatMessageListener } |
    { method: ChatServiceMethod.DeleteMessage, listener: ChatDeletionListener };

export class ChatService {
    private readonly connection: Promise<HubConnection | null>;
    private connectionStartError: Error | null = null;
    private readonly listeners = {} as { [id: string]: ChatListener }

    constructor(private readonly apiBaseUrl: string) {
        const _conn = new HubConnectionBuilder()
            .withUrl(`${apiBaseUrl}api/chat`)
            .build();

        _conn.on(ChatServiceMethod.SendMessage,
            (msg: ChatMessage) => this.onMessage(ChatServiceMethod.SendMessage, msg));
        _conn.on(ChatServiceMethod.DeleteMessage,
            (cmd: ChatDeletionCommand) => this.onMessage(ChatServiceMethod.DeleteMessage, cmd));

        this.connection = _conn
            .start()
            .then(() => _conn)
            .catch(err => {
                this.connectionStartError = err instanceof Error
                    ? err
                    : new Error("Failed to connect to chat service.");
                return null;
            });
    }

    public async sendMessage(message: Omit<ChatMessage, "messageId">) {
        const connection = await this.connection;
        if (!connection) {
            throw this.connectionStartError ?? new Error("Failed to connect to chat service.");
        }
        const resp = await fetch(`${this.apiBaseUrl}api/chat/sendmessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });
        if (!resp.ok) {
            let body: string;
            if (resp.status === 409 && (body = await resp.text())) {
                throw new Error(body);
            }
            throw new Error("Failed to send chat message.");
        }
    }

    public async deleteMessage(messageId: string) {
        const connection = await this.connection;
        if (!connection) {
            throw this.connectionStartError ?? new Error("Failed to connect to chat service.");
        }
        const resp = await fetch(`${this.apiBaseUrl}api/chat/deletemessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId })
        });
        if (!resp.ok) {
            let body: string;
            if (resp.status === 409 && (body = await resp.text())) {
                throw new Error(body);
            }
            throw new Error("Failed to delete chat message.");
        }
    }

    public async dispose() {
        const connection = await this.connection;
        if (connection) {
            await connection.stop();
        }
    }

    public addMessageListener(listener: ChatListener) {
        const id = uuid();
        this.listeners[id] = listener;
        return id;
    }

    public removeMessageListener(listenerId: string) {
        if (this.listeners[listenerId]) {
            delete this.listeners[listenerId];
        }
    }

    private onMessage(type: ChatServiceMethod.SendMessage, arg: ChatMessage): void;
    private onMessage(type: ChatServiceMethod.DeleteMessage, arg: ChatDeletionCommand): void;
    private onMessage(type: ChatServiceMethod, arg: any) {
        Object.keys(this.listeners)
            .forEach(id => {
                const listener = this.listeners[id];
                if (listener.method === type) {
                    listener.listener(arg);
                }
            });
    }
}
