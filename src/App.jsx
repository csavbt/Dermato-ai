
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
      // On envoie l'image encodée base64 au modèle Hugging Face vit-gpt2-image-captioning
      const response = await fetch(
        'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_HUGGINGFACE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: image
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        setResult(data[0].generated_text);
      } else if (data.error) {
        setResult(`Erreur Hugging Face : ${data.error}`);
      } else {
        setResult('Impossible de décrire cette image.');
      }
    } catch (error) {
      console.error('Erreur Hugging Face:', error);
      setResult('Erreur pendant l’analyse.');
    }

    setLoading(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Description Visuelle IA (Rapide)</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {image && <img src={image} alt="preview" style={{ maxWidth: '300px', margin: '10px auto' }} />}
      <br />
      <button onClick={analyzeImage} disabled={loading}>
        {loading ? 'Analyse en cours...' : 'Décrire l’image'}
      </button>
      {result && <p style={{ marginTop: '20px' }}>{result}</p>}
      <p style={{ fontSize: '12px', color: 'gray' }}>Description générée par un modèle Hugging Face léger.</p>
    </div>
  );
}
