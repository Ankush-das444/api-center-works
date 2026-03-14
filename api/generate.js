export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { imageBase64, positivePrompt, negativePrompt } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        const falKey = process.env.FAL_KEY;
        if (!falKey) return res.status(500).json({ error: 'Server missing FAL Key' });

        // Ensure there is at least a fallback prompt
        const finalPositive = positivePrompt && positivePrompt.trim() !== "" 
            ? positivePrompt 
            : "Cinematic subtle motion, perfect seamless loop, high quality, 4k resolution.";

        // We combine your core protections with the user's custom negative prompt
        const baseNegative = "camera movement, panning, zooming, stretching, melting, deformed fingers, changing shapes, bad anatomy";
        const finalNegative = negativePrompt && negativePrompt.trim() !== "" 
            ? `${baseNegative}, ${negativePrompt}` 
            : baseNegative;

        console.log(`Pinging Fal.ai - Pos: "${finalPositive}" | Neg: "${finalNegative}"`);

        const dataUri = `data:image/jpeg;base64,${imageBase64}`;

        const falResponse = await fetch("https://fal.run/fal-ai/ltx-video", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image_url: dataUri,
                prompt: finalPositive,
                negative_prompt: finalNegative,
                aspect_ratio: "9:16", // STRICT 9:16 RATIO LOCKED IN
            })
        });

        if (!falResponse.ok) {
            const errorText = await falResponse.text();
            return res.status(500).json({ error: "Fal failed: " + errorText });
        }

        const data = await falResponse.json();
        
        return res.status(200).json({
            success: true,
            videoUrl: data.video.url
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
