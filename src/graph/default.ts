/*
<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", background: "#fffffd" }}>
	<img src={`data:image/svg+xml;base64,${Buffer.from(icon).toString("base64")}`} alt="LOGO" width={120} height={120} />
	<span style={{ fontSize: "4rem", fontWeight: 900, color: "#1a1a1a", textAlign: "center" }}>{title}</span>
	<span style={{ fontSize: "1.75rem", color: "#888888", textAlign: "center", maxWidth: "75%" }}>{description}</span>
	<span style={{ marginTop: "3rem", borderBottom: "2px solid", padding: "0 0.5rem", fontSize: "1.5rem", color: "#666666" }}>{author}</span>
</div>
*/

import type { OgTemplate } from "./render";
import { ICON_DATA_URL, renderOg } from "./render";

type DefaultProps = {
	locale: string;
	title: string;
	description: string;
	author: string;
};

/** VDOM template for the site-wide Open Graph card. */
const template: OgTemplate = props => {
	const { title, description, author } = props as DefaultProps;
	return {
		type: "div",
		props: {
			style: {
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "1.5rem",
				background: "#fffffd"
			},
			children: [
				{
					type: "img",
					props: {
						src: ICON_DATA_URL,
						alt: "LOGO",
						width: 120,
						height: 120
					}
				},
				{
					type: "span",
					props: {
						style: {
							fontSize: "4rem",
							fontWeight: 900,
							color: "#1a1a1a",
							textAlign: "center"
						},
						children: title
					}
				},
				{
					type: "span",
					props: {
						style: {
							fontSize: "1.75rem",
							color: "#888888",
							textAlign: "center",
							maxWidth: "75%"
						},
						children: description
					}
				},
				{
					type: "span",
					props: {
						style: {
							marginTop: "3rem",
							borderBottom: "2px solid",
							padding: "0 0.5rem",
							fontSize: "1.5rem",
							color: "#666666"
						},
						children: author
					}
				}
			]
		}
	};
};

export default (props: DefaultProps) => renderOg<DefaultProps>(template, props);
