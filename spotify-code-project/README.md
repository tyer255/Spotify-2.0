# 3D Printable Spotify Code Generator

[![License](https://img.shields.io/github/license/timoseyfarth/smoothiepy)](https://github.com/timoseyfarth/spotify-code-project/blob/main/LICENSE)
[![](https://img.shields.io/badge/GitHub-Frontend-blue)](https://github.com/timoseyfarth/spotify-code-frontend)
[![](https://img.shields.io/badge/GitHub-Backend-darkgreen)](https://github.com/timoseyfarth/spotify-code-backend)

Turn your favorite Spotify tracks, albums, or playlists into a unique, scannable 3D model! This project combines a web app with a parametric 3D modeling on MakerWorld to create personalized Spotify Tags.

[MakerWorld 3D Model Link](https://makerworld.com/en/models/1660269-customizable-spotify-keychain-tag) • [Live Code Generator Website](https://spotify-code.seyfarth.dev/)

---

## ✨ Special Features

* **Effortless Customization**: I personally wanted to make the customization process as simple and straight-forward as possible. I made a really detailed description on how to customize the model on the [MakerWorld Model Page](https://makerworld.com/en/models/1660269-customizable-spotify-keychain-tag)
* **Toggle Special Features**: I made it possible to customize special features of the 3D Model including the option for an album cover slot and a keychain hole

---

## 🚀 How It Works

The magic happens in a few simple steps:

1.  **Input**: You provide a Spotify Share URL to our web application.
2.  **Backend Processing**: The server fetches the corresponding Spotify Code image. It then uses image recognition to measure the height of the 20 data-carrying bars.
3.  **Encoding**: The 20 bar heights are encoded into a two Base-8 number.
5.  **3D Model Generation**: You paste these two codes into the parameters on MakerWorld. The model's internal logic decodes them back into the 20 bar heights and constructs the unique 3D geometry of your code.

For more details about the frontend or backend please refer to the `README.md` of the corresponding repo.

---

## 🛠️ Project Structure

* **`frontend`**: The user-facing web application built with Vue. It allows users to generate codes from a Spotify URL. **[Link to Frontend Repo](https://github.com/timoseyfarth/spotify-code-frontend)**
* **`backend`**: The server that handles the code generation logic, built with Python. **[Link to Backend Repo](https://github.com/timoseyfarth/spotify-code-backend)**

### For Developers

If you want to run this project locally, clone this repository with its submodules:
```bash
git clone --recurse-submodules git@github.com:timoseyfarth/spotify-code-project.git
```


The instructions on how to get the Backend and Frontend running are in the corresponding repos.
