export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        console.log("1. Image successfully received by Vercel!");
        console.log("2. Simulating AI Generation...");

        // Simulate a 3-second AI processing delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // A reliable test video URL
        const mockVideoUrl = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4";

        console.log("3. Success! Sending video link back to Android.");
        return res.status(200).json({
            success: true,
            videoUrl: mockVideoUrl
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
