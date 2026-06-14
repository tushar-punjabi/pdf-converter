export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileName, fileData, fileExt } = req.body;

        if (!fileData || !fileExt || !fileName) {
            return res.status(400).json({ error: 'Missing file data or parameters' });
        }

        const apiKey = process.env.CONVERTAPI_SECRET; 
        
        if (!apiKey) {
            return res.status(500).json({ error: 'Converter API key not configured' });
        }

        const response = await fetch(`https://v2.convertapi.com/convert/${fileExt}/to/pdf?Secret=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Parameters: [
                    {
                        Name: 'File',
                        FileValue: {
                            Name: fileName,
                            Data: fileData
                        }
                    }
                ]
            })
        });

        const result = await response.json();

        if (!response.ok || !result.Files || result.Files.length === 0) {
            throw new Error(result.Message || 'Conversion failed at the API endpoint.');
        }

        const pdfBase64 = result.Files[0].FileData;
        
        // FIX: Ensure we use the 'fileName' variable passed in from the request body
        const cleanName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

        return res.status(200).json({ pdf: pdfBase64, name: `${cleanName}.pdf` });

    } catch (error) {
        console.error("Serverless Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
