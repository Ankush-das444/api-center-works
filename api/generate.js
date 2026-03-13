export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        const falKey = process.env.FAL_KEY;
        if (!falKey) return res.status(500).json({ error: 'Server missing FAL Key' });

        console.log("1. Image received! Pinging Fal.ai (LTX Video Fast)...");

        // Format the Base64 string so Fal knows it is a JPEG
        const dataUri = `data:image/jpeg;base64,${imageBase64}`;

        // Hitting the ultra-fast LTX model on Fal
        const falResponse = await fetch("https://fal.run/fal-ai/ltx-video/image-to-video", {
            method: "POST",
            headers: {
                "Authorization": `Key ${falKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image_url: dataUri,
                // THE MASTER PROMPT FOR ANIME WALLPAPERS:
                prompt: "Cinematic anime live wallpaper. Extremely subtle breathing motion. Eyes blinking occasionally. Glowing red particles floating and swirling slowly in the foreground. Hair flowing gently in a soft breeze. The hand and weapon move slightly with her breathing. Camera is completely static. High quality, highly detailed masterpiece, perfect seamless loop.",
                negative_prompt: "camera movement, zooming, panning, fast motion, melting weapon, deformed hands, morphing, changing shapes, bad anatomy",
                // Keep the motion scale low so she doesn't mutate
                motion_scale: 0.3, 
            })
        });


        if (!falResponse.ok) {
            const errorText = await falResponse.text();
            console.error("Fal Error:", errorText);
            return res.status(500).json({ error: "Fal failed to generate video: " + errorText });
        }

        const data = await falResponse.json();
        
        console.log("2. Video Generated! Fal URL:", data.video.url);

        // Send the real Fal video URL back to your Android app
        return res.status(200).json({
            success: true,
            videoUrl: data.video.url
        });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message });
    }
                }
