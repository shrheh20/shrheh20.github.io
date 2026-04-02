# Projects

## FAST Center & Illinois SBIR Performance Dashboards
**Employer:** EnterpriseWorks, UIUC Research Park
**Period:** 2024–Present
**Status:** Shareable on Tableau Public

### Situation
EnterpriseWorks operates as the FAST Center for the state of Illinois, helping startups win SBIR/STTR federal grants. They needed to quantify their impact to state stakeholders in order to secure a program extension.

### Task
Shreyas was tasked with measuring and visualising the FAST Center's impact since its 2020 launch, using data spanning 40+ years of Illinois SBIR/STTR award history.

### Action (the real work)
Two primary data sources: SBA.gov public award data and EnterpriseWorks' internal tracking data (webinar participants, proposal draft assistance, award submission assistance). The core problem: SBA data had no field indicating which FAST Center assisted which company. Shreyas built a master Excel sheet of all FAST Center-assisted companies, then used XLOOKUP to add an "Assisted" TRUE/FALSE column to the SBA dataset by matching company names. He fed the fused dataset into Tableau and built two narrative tracks:
1. FAST Center Impact: BAN metrics (total funding raised, unique awardees, companies assisted), yearly growth in companies assisted and award amounts, geographic map of company HQ locations, % of Illinois SBIR awards captured by FAST-assisted companies
2. Illinois Performance: filled state choropleth of SBIR awards by state, Illinois ranking among all 50 states, pre/post FAST Center funding change, percentage of funds captured. Used Tableau calculated fields to split pre-2020 vs post-2020 data.

### Result
Dashboards were presented directly to state stakeholders and were instrumental in securing EnterpriseWorks' extension as the Illinois FAST Center. Key metrics: $65.63M raised by FAST-assisted companies since 2021, 26.9x growth in Illinois SBIR funding since 1984, 49 unique FAST-assisted awardees, Illinois ranked 15th nationally.

**Tools:** Tableau, Python, Excel, SBA.gov data, Salesforce, 5 data sources

---

## Founder & Funding Intelligence Dashboard
**Employer:** EnterpriseWorks, UIUC Research Park
**Status:** Shareable on Tableau Public

### What it does
A dual-dashboard suite giving EnterpriseWorks leadership a complete picture of their startup ecosystem — who the founders are (UIUC college affiliation, admission year, industry), where their companies are headquartered, and how funding has flowed across the portfolio.

### Key metrics surfaced
605 founders profiled, $1.6B in total funding tracked across 353 EW companies, broken down by funding round (Series A through E, Seed), industry vertical, and company status (Active, Acquired, Inactive). Software/Analytics leads with $545.9M, followed by Energy/Green Technology at $396.8M.

**Tools:** Tableau, Python, Salesforce, Excel

---

## EIR Usage & ROI Analytics Dashboard
**Employer:** EnterpriseWorks, UIUC Research Park
**Status:** Confidential (available on request)

### Situation
EnterpriseWorks employs Entrepreneurs-in-Residence (EIRs) who bill hourly for time spent mentoring portfolio startups. Leadership had no visibility into which EIRs were over or underutilised, or whether the spend was generating returns.

### Task
Build a dashboard for internal monitoring to evaluate EIR performance and ROI so leadership could rebalance EIR allocation.

### Action
Pulled EIR meeting invoices from Salesforce — each record contained hours billed, hourly rate, EIR name, and companies assisted. Calculated per-company cost of EIR services. Mapped company-level EIR spend against total funding raised by each company to derive a funding efficiency ratio. Built: treemap of EIR spend by mentor, scatter plot of EIR spend vs funding raised (positive correlation), ROI trend lines by EIR over years, funding efficiency bar chart vs average.

### Result
Established a clear positive correlation between EIR investment and startup funding outcomes. Used by leadership for EIR performance monitoring and resource allocation. 15 EIRs tracked.

---

## Demand Forecasting & Sales Analysis
**Employer:** Business Intelligence Group, UIUC
**Period:** Aug–Dec 2024
**Status:** On Tableau Public

### What was done
Analysed 10 years of SKU-level sales data for a leading Asian wholesale food supplier across 16 branches and 100 SKUs consolidated in Snowflake. Built five-year time-series forecasts incorporating CPI and fuel price indices. Identified seasonal demand patterns.

### Result
$120K in working capital unlocked, overstock reduced by 25%, inventory turnover improved by 15%, query access speed improved by 45%.

**Tools:** Tableau, Snowflake, Python, CPI/fuel price indices

---

## Event Registration & Engagement Dashboard
**Employer:** EnterpriseWorks, UIUC Research Park

Cvent + Qualtrics ETL pipeline tracking 479 event registrations across 10+ EnterpriseWorks event types. Week-over-week registration trends, session-level breakdown (Founders Showcase, TechRise Startup Pitch, iVenture Demo Day, Illinois Capital Forum, etc.), geographic distribution of registrants. Used for real-time event performance monitoring by leadership.

---

## Ask Shreyas — AI Portfolio Chatbot (This project)
A RAG-powered conversational AI embedded in his portfolio. Built with FastAPI, ChromaDB, BAAI/bge-small-en-v1.5 embeddings, and Groq Llama 3. Demonstrates LLM integration, vector search, metadata-aware retrieval routing, and API design. Deployed on Render.
