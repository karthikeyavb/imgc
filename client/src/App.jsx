import React, { useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://imgc-chitralai-backend.onrender.com'

function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null)
  const [keywords, setKeywords] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  function handleDrag(e) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('keywords', keywords)
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onUploaded(data)
      setFile(null)
      setKeywords('')
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
    } catch (err) {
      alert(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>Upload Image</h3>
      <div 
        className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e)=> setFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" className="file-input-label">
          {file ? (
            <div className="file-preview">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          ) : (
            <div className="file-placeholder">
              <span className="upload-icon">📁</span>
              <span>Click to select or drag & drop</span>
              <small>Supports JPG, PNG, GIF, WebP</small>
            </div>
          )}
        </label>
      </div>
      <input 
        type="text" 
        placeholder="Keywords (comma separated)" 
        value={keywords} 
        onChange={(e)=> setKeywords(e.target.value)} 
      />
      <button disabled={!file || isUploading}>
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </button>
    </form>
  )
}

function SearchBar({ onSearch, initial }) {
  const [q, setQ] = useState(initial || '')
  const canSearch = useMemo(()=> q.trim().length >= 0, [q])
  return (
    <form className="card" onSubmit={(e)=>{e.preventDefault(); canSearch && onSearch(q)}}>
      <h3>Search Images</h3>
      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input 
          value={q} 
          onChange={(e)=> setQ(e.target.value)} 
          placeholder="Enter keywords (e.g., beach, sunset, nature)" 
        />
      </div>
      <button disabled={!canSearch}>
        {q.trim() ? `Search for "${q}"` : 'Search All Images'}
      </button>
    </form>
  )
}

function ImageGrid({ items }) {
  if (!items?.length) return (
    <div className="empty-state">
      <p>No images found. Upload some images to get started!</p>
    </div>
  )
  return (
    <div className="grid">
      {items.map((it)=> (
        <figure key={it.key} className="tile">
          <img src={it.url} alt={it.keywords?.join(', ') || 'Image'} loading="lazy" />
          {it.keywords?.length ? <figcaption>{it.keywords.join(', ')}</figcaption> : null}
        </figure>
      ))}
    </div>
  )
}

export default function App(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function search(q=''){
    setLoading(true)
    try{
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search error')
      setItems(data.items)
    }catch(err){
      alert(err.message)
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ search('') },[])

  return (
    <div className="container">
      <header>
        <h1>ImgC-Chitralai</h1>
        <span className="muted">S3-backed image store & search</span>
      </header>
      <div className="actions">
        <UploadForm onUploaded={()=> search('')} />
        <SearchBar onSearch={search} />
      </div>
      {loading ? <div className="loading">Loading images...</div> : <ImageGrid items={items} />}
      <footer>
        <small>Set VITE_API_URL to your server URL when deploying.</small>
      </footer>
    </div>
  )
}
