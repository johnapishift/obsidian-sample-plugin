import { Plugin, TFile, MarkdownView } from "obsidian";
import * as Automerge from "@automerge/automerge";
import path from "path";

export default class MyAutomergePlugin extends Plugin {
	private doc: Automerge.Doc<{ text: Automerge.Text }>;

	async onload() {
		// Determine the path to the .wasm file
		const wasmPath = path.join(
			this.manifest.dir,
			"assets",
			"automerge_wasm_bg.wasm"
		);

		// Initialize Automerge with the wasmURL option
		await Automerge.init({ wasmURL: wasmPath });

		// Initialize your Automerge document
		this.doc = Automerge.from<{ text: Automerge.Text }>({
			text: new Automerge.Text(),
		});
	}

	setupWebSocket() {
		this.socket = new WebSocket("wss://your-websocket-server");

		this.socket.onmessage = (event) => {
			const remoteChange = new Uint8Array(event.data);
			const [newDoc] = Automerge.applyChanges(this.doc, [remoteChange]);
			this.doc = newDoc;
			this.updateEditorContent(this.doc.text.toString());
		};
	}

	registerEvents() {
		this.registerEvent(
			this.app.workspace.on("file-open", (file: TFile) => {
				if (file) this.loadNoteToAutomerge(file);
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-change", (editor) => {
				const content = editor.getValue();
				this.doc = Automerge.change(this.doc, (d) => {
					d.text.replace(0, d.text.length, ...content);
				});
				this.sendChanges(Automerge.getLastLocalChange(this.doc));
			})
		);
	}

	async loadNoteToAutomerge(file: TFile) {
		const content = await this.app.vault.read(file);
		this.doc = Automerge.from({ text: new Automerge.Text(content) });
	}

	sendChanges(change: Uint8Array) {
		this.socket.send(change);
	}

	updateEditorContent(content: string) {
		const editor =
			this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (editor && editor.getValue() !== content) {
			editor.setValue(content);
		}
	}

	onunload() {
		this.socket.close();
	}
}
