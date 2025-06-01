export interface Env {
	TEAMS_WEBHOOK_URL: string;   // ← set in Workers Dashboard
}

function makeTeamsPayload(v1: string, v2: string, v3: string) {
	return {
		type: "message",
		attachments: [
			{
				contentType: "application/vnd.microsoft.card.adaptive",
				contentUrl: null,
				content: {
					$schema: "http://adaptivecards.io/schemas/adaptive-card.json",
					type: "AdaptiveCard",
					version: "1.5",
					body: [
						{
							type: "ColumnSet",
							columns: [
								{
									type: "Column",
									width: "auto",
									items: [
										{
											type: "Image",
											url: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fmedia.tenor.com%2FiQGe-VgwTgcAAAAM%2Fcivilization6-gandhi.gif",
											size: "Medium",
											altText: "Civ VI Gandhi"
										}
									]
								},
								{
									type: "Column",
									width: "stretch",
									items: [
										{
											type: "TextBlock",
											size: "Large",
											weight: "Bolder",
											wrap: true,
											text: `${v1 ?? "Unknown Game"}`,
										},
										{
											type: "TextBlock",
											wrap: true,
											text: `**Dabartinio žaidėjo ėjimas:** ${v2 ?? "Unknown Player"}`,
										},
										{
											type: "FactSet",
											facts: [
												{ title: "Ėjimas -", value: v3 ?? "Unknown Turn" },
											]
										}
									]
								}
							]
						}
					]
				}
			}
		]
	};
}

// ------------- request handler ----------------------------
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Only POST", { status: 405 });
		}

		let body: { value1?: string; value2?: string; value3?: string };
		try {
			body = await request.json();
		} catch {
			return new Response("Bad JSON", { status: 400 });
		}

		const { value1, value2, value3 } = body;
		if (!value1 || !value2 || !value3) {
			return new Response("value1/2/3 required", { status: 400 });
		}

		if (value1 != "Teltonika Networks 2025/2026 Civ VI Tornamentas") {
			return new Response("Invalid game name", { status: 400 });
		}

		const teamsPayload = makeTeamsPayload(value1, value2, value3);
		console.log("Sending to Teams:", JSON.stringify(teamsPayload, null, 2));

		const resp = await fetch(env.TEAMS_WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(teamsPayload)
		});

		if (!resp.ok) {
			return new Response("Teams webhook failed", { status: 502 });
		}

		return new Response("Sent to Teams", { status: 200 });
	}
};