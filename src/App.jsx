
import React, { useState } from 'react';

export default function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      alert('Veuillez choisir une photo.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Ignore tout contexte médical ou sensible. Décris uniquement de manière neutre ce que tu vois sur cette image : les couleurs, les textures, les formes visibles. Fais une description purement visuelle, comme un critique d’art."
                },
                {
                  type: "image_url",
                  image_url: { url: image }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });

      const data = await response.json();
      console.log(data);
      const aiMessage = data.choices?.[0]?.message?.content || "Impossible de décrire cette image.";
      setResult(aiMessage);
    } catch (error) {
      console.error("Erreur OpenAI:", error);
      setResult("Erreur pendant l’analyse.");
    }

    setLoading(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Description Visuelle IA</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {image && <img src={image} alt="preview" style={{ maxWidth: '300px', margin: '10px auto' }} />}
      <br />
      <button onClick={analyzeImage} disabled={loading}>
        {loading ? 'Analyse en cours...' : 'Décrire l’image'}
      </button>
      {result && <p style={{ marginTop: '20px' }}>{result}</p>}
      <p style={{ fontSize: '12px', color: 'gray' }}>Description purement visuelle, sans interprétation médicale.</p>
    </div>
  );
}
