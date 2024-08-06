# GGSIPU Alert Bot

## About
GGSIPU Alert Bot is a web scraping and notification system designed to fetch and store notices from the Guru Gobind Singh Indraprastha University (GGSIPU) website. It provides an efficient way to keep track of the latest announcements and updates from the university. The project includes an API that serves these notices, which is used by Telegram and WhatsApp bots to deliver notifications to users.

Using various Node.js and Express scripts, an automated job runs on Linux servers every hour which uploads new notices and sends them to various platforms.

### Telegram Channel
[@ggsipunotices](https://t.me/ggsipunotices) - Join Here

### Disclaimer
The project is not affiliated with GGSIPU or any other Government entity.

## Table of Contents
1. [Features](#features)
2. [How to Contribute](#how-to-contribute)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [Project Structure](#project-structure)
8. [Key Components](#key-components)
9. [Database](#database)
10. [Scripts](#scripts)
11. [API Documentation](#api-documentation)
12. [Deployment](#deployment)
13. [Related Projects](#related-projects)
14. [Troubleshooting](#troubleshooting)
15. [License](#license)

## Features

- Scrapes notices from the GGSIPU website automatically
- Stores notices in a PostgreSQL database for efficient retrieval
- Provides API endpoints to access the latest notices
- Handles URL encoding for consistent data storage
- Includes scripts for database maintenance and updates
- Hosted on Azure for reliable access
- Integrates with Telegram and WhatsApp bots for user notifications
- Runs automated jobs every hour to check and distribute new notices

## How to Contribute

We welcome contributions to improve the GGSIPU Alert Bot! There are several areas where the project needs improvement, and your expertise could make a significant difference.

### Areas for Improvement

1. **Date Extraction Logic**

   One of the main challenges we face is extracting accurate dates from the notices. The GGSIPU website doesn't provide explicit dates for notices, so we rely on extracting dates from the notice URLs. However, our current pattern recognition sometimes fails to identify the correct date.

   **Current Approach:**
   We extract dates from URLs using patterns. Here are some examples:

   - `http://www.ipu.ac.in/Pubinfo2024/nt200724401.pdf` → Date: 20/07/2024
   - `http://www.ipu.ac.in/pubinfo/circflag250118.pdf` → Date: 25/01/2018
   - `http://www.ipu.ac.in/Pubinfo2024/formhost2425210724.pdf` → Date: 21/07/2024

   **The Challenge:**
   Some URL patterns are not recognized by our current logic. For example:

   - `http://www.ipu.ac.in/Pubinfo2024/nt200724401 (9).pdf`
   - `http://www.ipu.ac.in/Pubinfo2024/cnnt1107249p (4).pdf`

   We need to improve our pattern recognition to handle these varied URL formats and extract dates accurately.

2. **URL Encoding**

   We've encountered issues with spaces in URLs. While we've implemented a solution to encode spaces as `%20`, there might be other special characters that need proper encoding.

3. **Performance Optimization**

   As the number of notices grows, we need to ensure our database queries and API responses remain efficient. Contributions to optimize database operations and API performance are welcome.

4. **User Interface for Bots**

   While we have functional bots for Telegram and WhatsApp, there's room for improvement in their user interfaces and interaction patterns.

### How You Can Help

1. **Code Contributions**
   - Fork the repository
   - Create a new branch for your feature or bug fix
   - Make your changes and submit a pull request
   - Ensure your code follows the project's coding standards and includes appropriate tests

2. **Issue Reporting**
   - If you notice any bugs or have feature suggestions, please open an issue on GitHub
   - Provide as much detail as possible, including steps to reproduce for bugs

3. **Documentation**
   - Help improve our documentation, including this README
   - Write tutorials or guides for using the GGSIPU Notice Tracker

4. **Testing**
   - Help test the application, especially the date extraction logic with various URL patterns
   - Report any inconsistencies or errors you find

### Getting Started

1. Check the [Issues](https://github.com/shubhsardana29/notice-scraper/issues) page for existing problems or feature requests
2. Comment on an issue if you want to work on it, or open a new issue to discuss your ideas
3. Follow the [Installation](#installation) and [Configuration](#configuration) steps in this README to set up your development environment

We appreciate all contributions, big or small. Together, we can make the GGSIPU Alert Bot more robust and useful for the entire community!

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- PostgreSQL (v12 or later)
- TypeScript (v4 or later)
- Azure account (for deployment)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/shubhsardana29/notice-scraper.git
   cd notice-scraper
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database (instructions in the [Database](#database) section)

4. Build the project:
   ```
   npm run build
   ```

## Configuration

1. Create a `.env` file in the root directory with the following content:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/ggsipu_notices?schema=public"
   PORT=3000
   ```
   Replace `username`, `password`, and other details as per your PostgreSQL setup.

2. Update `prisma/schema.prisma` if you need to make any changes to the database schema.

## Usage

1. Start the server:
   ```
   npm start
   ```

2. To access the latest notices, send a GET request to:
   ```
   http://localhost:3000/api/notices/latest
   ```

## Project Structure

```
ggsipu-notice-tracker/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── utils/
│   ├── scripts/
│   └── app.ts
├── prisma/
│   └── schema.prisma
├── dist/
├── node_modules/
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Key Components

1. `src/utils/scraper.ts`: Handles web scraping of notices from the GGSIPU website.
2. `src/services/notice.service.ts`: Manages database operations for notices.
3. `src/controllers/notice.controller.ts`: Handles HTTP requests and responses for notice-related operations.
4. `src/app.ts`: The main application file that sets up the Express server and routes.

## Database

The project uses PostgreSQL with Prisma as the ORM. To set up the database:

1. Ensure PostgreSQL is installed and running.
2. Create a new database named `ggsipu_notices`.
3. Run Prisma migrations:
   ```
   npx prisma migrate dev
   ```

## Scripts

- `npm start`: Starts the server
- `npm run build`: Compiles TypeScript to JavaScript


## API Documentation

The GGSIPU Notice Tracker API provides the following endpoints:

1. Get Latest Notices
   - Endpoint: `GET /api/notices/latest`
   - Description: Retrieves the most recent notices

   - Response:
     ```json
     [
       {
         "id": 1,
         "date": "2024-07-21",
         "title": "Notice Title",
         "url": "http://www.ipu.ac.in/notices/example.pdf",
       },
       ...
     ]
     ```


## Deployment

The GGSIPU Alert Bot API is hosted on Azure App Service. To deploy updates:

1. Ensure you have the Azure CLI installed and are logged in.
2. Build the project:
   ```
   npm run build
   ```
3. Deploy to Azure:
   ```
   az webapp up --name GGSIPUAlertBot --resource-group YourResourceGroup
   ```

Replace `GGSIPUAlertBot` and `YourResourceGroup` with your actual Azure App Service name and resource group.

## Related Projects

This API serves as the backend for two bot projects:

1. Telegram Bot: [GGSIPU Alert Telegram Bot](https://github.com/shubhsardana29/ggsipu-notices-bot)
   - Delivers notice updates to users via Telegram
   - Uses this API to fetch the latest notices
   - Join the Telegram channel: [@ggsipunotices](https://t.me/ggsipunotices)

2. WhatsApp Bot: [GGSIPU Alert WhatsApp Bot](https://github.com/shubhsardana29/whatsapp-bot-server)
   - Sends notice updates to users on WhatsApp

Both bots use the `/api/notices/latest` endpoint to fetch recent notices and notify users of updates.

## Troubleshooting

For API-related issues:
1. Check the Azure App Service logs for any error messages.
2. Ensure the database connection string in Azure App Service configuration is correct.
3. Verify that the API endpoints are accessible and returning expected data.

For bot-related issues:
1. Check the respective bot's logs for any connection errors to the API.
2. Ensure the bot is using the correct API URL and any required authentication.

## License

This project is licensed under the MIT License.
