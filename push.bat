@echo off
cd /d "%~dp0"
echo === Configuration Git ===
git config --global user.email "floflo.hemery@gmail.com"
git config --global user.name "Florian Hemery"
echo === Initialisation du depot Git ===
git init
git add .
git commit -m "feat: portfolio initial - React + Vite + Three.js"
echo === Connexion au remote ===
git remote add origin git@github.com:florianhemery/Portfolio.git
git branch -M main
echo === Push vers GitHub ===
git push -u origin main
echo.
echo === Termine ! ===
pause
