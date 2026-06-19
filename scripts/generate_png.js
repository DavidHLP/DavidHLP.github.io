import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const svgPath = path.resolve("public/favicon.svg");
const png96Path = path.resolve("public/favicon-96x96.png");
const png256Path = path.resolve("public/favicon-256x256.png");

async function main() {
	try {
		const svgBuffer = fs.readFileSync(svgPath);

		// Generate 96x96
		await sharp(svgBuffer).resize(96, 96).png().toFile(png96Path);
		console.log("Successfully generated public/favicon-96x96.png");

		// Generate 256x256 (temporary for ICO)
		await sharp(svgBuffer).resize(256, 256).png().toFile(png256Path);
		console.log("Successfully generated public/favicon-256x256.png");
	} catch (error) {
		console.error("Error generating PNG files:", error);
		process.exit(1);
	}
}

main();
