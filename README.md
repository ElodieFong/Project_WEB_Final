# macOS Setup 

## Start mysql
brew services start mysql

In the project folder :
cd backend/database  
npm install  
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql

## Start Backend Server
cd backend  
node src/server.js

## Start Frontend
cd frontend  
npm install vue-router axios  
npm run dev

# Windows Setup 

In the project folder in a terminal:
cd backend\database  
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql

## Start Backend Server
cd backend  
npm install
node src/server.js

## Start Frontend
npm install  
npm install vue-router axios  
cd frontend  
npm run dev