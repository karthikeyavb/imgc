ImgC: Image Storage & Retrieval (React + Express + AWS S3)

This project implements Task 1 from the prompt: a minimal Google Photos–like app where users upload images and search by keywords. Images are stored in AWS S3. Optional AI tagging can be added later.

Tech Stack
- Frontend: React (Vite)
- Backend: Node.js (Express)
- Storage: AWS S3 (object tags for keywords)
- Deploy: Netlify/Vercel (client) + Render/EC2/Elastic Beanstalk (server)

Project Structure
client/
  index.html
  package.json
  vite.config.js
  src/
    main.jsx
    App.jsx
    styles.css
server/
  package.json
  src/
    index.js
    s3.js
  .env.example

Prerequisites
- Node.js 18+
- An AWS account with an S3 bucket

Create an IAM user with programmatic access and S3 permissions (put, get, list, get object tagging).

Backend Setup
1. Copy env file:
   - Duplicate server/.env.example to server/.env and fill values.
2. Install and run:
cd server
npm install
npm run dev
Server runs at http://localhost:4000.

Frontend Setup
1. Configure API URL (optional):
   - Create client/.env with:
VITE_API_URL=http://localhost:4000
2. Install and run:
cd client
npm install
npm run dev
Open the local URL printed by Vite.

Usage
- Use Upload card to select an image and add comma-separated keywords (e.g., beach, sunset).
- Click Upload. Image is stored in S3 with keywords tag.
- Use Search card to filter by a keyword; results show in the grid.

Deploy
- Client: push client to Netlify/Vercel; set env VITE_API_URL to your server URL.
- Server: deploy server to Render/EB/EC2; set env vars from .env.example.

Notes
- Files are saved under uploads/ prefix in S3. Keywords are stored as object tags (keywords), |-delimited.
- The demo search is simple substring match on keywords. Enhance as needed.


