export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileName, fileData, fileExt } = req.body;

        if (!fileData || !fileExt) {
            return res.status(400).json({ error: 'Missing file data or extension' });
        }

        // Pulls your secret key safely from Vercel's environment variables
        const apiKey = process.env.CONVERTAPI_SECRET; 
        
        if (!apiKey) {
            return res.status(500).json({ error: 'Converter API key not configured in Vercel environment.' });
        }

        // Call the universal conversion API
        const response = await fetch(`https://v2.convertapi.com/convert/${fileExt}/to/pdf?Secret=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Parameters: [
                    {
                        Name: 'File',
                        FileValue: {
                            Name: fileName,
                            Data: fileData // Base64 string from frontend
                        }
                    }
                ]
            })
        });

        const result = await response.json();

        if (!response.ok || !result.Files || result.Files.length === 0) {
            throw new Error(result.Message || 'Conversion failed at the API endpoint.');
        }

        // Extract the converted PDF raw Base64 string
        const pdfBase64 = result.Files[0].FileData;
        const cleanName = fileName.substring(0, filename.lastIndexOf('.')) || fileName;

        return res.status(200).json({ pdf: pdfBase64, name: `${cleanName}.pdf` });

    } catch (error) {
        console.error("Serverless Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}