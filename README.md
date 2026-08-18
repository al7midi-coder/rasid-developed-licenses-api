# Rasid License Engine v32

خدمة API لوحدة التراخيص مبنية على Fastify وPostgreSQL/PostGIS.

Endpoints:

- `GET /health`
- `GET /api/v1/licenses/summary`
- `GET /api/v1/licenses/facets`
- `GET /api/v1/licenses?page=1&pageSize=25`
- `GET /api/v1/licenses/closures`
- `GET /api/v1/licenses/map?bbox=west,south,east,north&zoom=10`
- `POST /api/v1/licenses/:id/refer`
- `POST /api/v1/licenses/:id/decision`

تشترك جميع نقاط القراءة في فلاتر `q`, `dependency`, `department`, `status`, `completion`, `contractor`, `supervisor`, `road`, `dateFrom`, `dateTo`.
