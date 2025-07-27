
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
      // Upload temporaire de l'image sur imgbb
      const uploadRes = await fetch('https://api.imgbb.com/1/upload?key=9d2c6f1b77e1e82f25fb21a2bb9a4b6e', {
        method: 'POST',
        body: new URLSearchParams({
          image: image.split(',')[1]
        })
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error('Erreur upload image');
      const publicImageUrl = uploadData.data.url;

      // Appel Replicate BLIP-2
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Token ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: "2c021d5a88b46be73a9da90d7f49f8b0ebfdf4d02b9949e0997c6a93c1d41e3b",
          input: {
            image: publicImageUrl
          }
        })
      });

      const prediction = await response.json();
      console.log(prediction);

      if (prediction?.urls?.get) {
        let finalResult = null;
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000));
          const poll = await fetch(prediction.urls.get, {
            headers: {
              Authorization: `Token ${import.meta.env.VITE_REPLICATE_API_TOKEN}`
            }
          });
          const pollData = await poll.json();
          if (pollData.status === "succeeded") {
            finalResult = pollData.output;
            break;
          } else if (pollData.status === "failed") {
            throw new Error("Analyse échouée");
          }
        }
        if (finalResult) {
          setResult(finalResult);
        } else {
          setResult("Pas de résultat après plusieurs tentatives.");
        }
      } else {
        setResult("Erreur Replicate : pas de réponse valide.");
      }
    } catch (error) {
      console.error('Erreur Replicate:', error);
      setResult('Erreur pendant l’analyse.');
    }

    setLoading(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Description Visuelle IA (Replicate)</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {image && <img src={image} alt="preview" style={{ maxWidth: '300px', margin: '10px auto' }} />}
      <br />
      <button onClick={analyzeImage} disabled={loading}>
        {loading ? 'Analyse en cours...' : 'Décrire l’image'}
      </button>
      {result && <p style={{ marginTop: '20px' }}>{result}</p>}
      <p style={{ fontSize: '12px', color: 'gray' }}>Description visuelle générée par Replicate BLIP-2.</p>
    </div>
  );
}
