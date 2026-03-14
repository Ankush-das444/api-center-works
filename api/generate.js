export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { imageBase64, userPrompt } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        const falKey = process.env.FAL_KEY;
        if (!falKey) return res.status(500).json({ error: 'Server missing FAL Key' });

        // 1. The Prompt Engine (Matches the Android Dropdown)
        const stylePrompts = {
            "Cinematic Subtle": "Cinematic subtle motion, seamless loop, high quality, 4k resolution, beautiful lighting.",
            "Anime Live Wallpaper": "Cinematic anime live wallpaper. Live2D animation style. Extremely subtle breathing motion. Eyes blinking occasionally. Glowing particles floating in the foreground. Hair flowing gently. Camera is completely static, body is static. High quality, highly detailed masterpiece, perfect seamless loop.",
            "Cyberpunk Rain": "Heavy rain falling, neon lights flickering in the background, reflections on wet surfaces, cinematic, seamless loop, cyberpunk aesthetic.",
            "Dynamic Action": "Fast paced movement, dynamic wind, intense energy particles swirling, cinematic camera shake, dramatic lighting."
        };

        const finalPrompt = stylePrompts[userPrompt] || stylePrompts["Cinematic Subtle"];
        console.log(`Pinging Fal.ai for Style: ${userPrompt}`);

        const dataUri = `data:image/jpeg;base64,${imageBase64}`;

        // 2. The API Request (NOW WITH 9:16 ASPECT RATIO!)
        const falResponse = await fetch("https://fal.run/fal-ai/ltx-video", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image_url: dataUri,
                prompt: finalPrompt,
                negative_prompt: "camera movement, panning, zooming, stretching, melting, deformed fingers, changing shapes, bad anatomy",
                aspect_ratio: "9:16", // FIXES THE STRETCHING
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
