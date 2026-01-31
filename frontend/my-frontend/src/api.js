const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const shortenUrl = async (longUrl, customCode = null) => {
    const response = await fetch(`${API_URL}/api/shorten`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ longUrl, customCode }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to shorten URL');
    }

    return data;
};

export const getUrlStats = async (shortCode) => {
    const response = await fetch(`${API_URL}/api/stats/${shortCode}`);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stats');
    }

    return data;
};
