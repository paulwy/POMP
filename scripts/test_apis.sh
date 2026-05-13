#!/bin/bash

# POMP API Comprehensive Test Script
# 测试所有模块的API端点

BASE_URL="http://localhost:8000"
PASS=0
FAIL=0
TOTAL=0

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local method=$1
    local endpoint=$2
    local name=$3
    local data=$4

    TOTAL=$((TOTAL + 1))

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" \
            -d "$data" "$BASE_URL$endpoint" 2>/dev/null)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "  Response: ${body:0:200}"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# 测试健康检查
echo "=========================================="
echo "  POMP API Comprehensive Test Suite"
echo "=========================================="
echo ""

echo "-------------------------------------------"
echo "1. Health Check"
echo "-------------------------------------------"
test_api "GET" "/health" "Health Check"

echo ""
echo "-------------------------------------------"
echo "2. Authentication & Users"
echo "-------------------------------------------"
test_api "GET" "/api/v1/auth/users" "Get Users List"
test_api "POST" "/api/v1/auth/register" "Register User" '{"email":"test@example.com","password":"Test123456","name":"Test User"}'

echo ""
echo "-------------------------------------------"
echo "3. Dashboard APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/dashboard/stats" "Dashboard Stats"
test_api "GET" "/api/v1/dashboard/production-trend" "Production Trend"
test_api "GET" "/api/v1/dashboard/department-distribution" "Department Distribution"
test_api "GET" "/api/v1/dashboard/attendance-summary" "Attendance Summary"
test_api "GET" "/api/v1/dashboard/approval-stats" "Approval Stats"
test_api "GET" "/api/v1/dashboard/leave-distribution" "Leave Distribution"

echo ""
echo "-------------------------------------------"
echo "4. Organization APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/departments" "Get Departments"
test_api "GET" "/api/v1/organization/positions" "Get Positions"
test_api "GET" "/api/v1/organization/position-levels" "Get Position Levels"
test_api "GET" "/api/v1/organization/approval-rules" "Get Approval Rules"

echo ""
echo "-------------------------------------------"
echo "5. HR APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/hr/employees" "Get Employees"
test_api "GET" "/api/v1/hr/attendance/today" "Get Today Attendance"
test_api "GET" "/api/v1/hr/attendance/records" "Get Attendance Records"
test_api "GET" "/api/v1/hr/attendance/statistics" "Get Attendance Statistics"
test_api "GET" "/api/v1/hr/attendance/month" "Get Monthly Attendance"

echo ""
echo "-------------------------------------------"
echo "6. Workflow & Approval APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/workflow/tasks/pending" "Get Pending Tasks"
test_api "GET" "/api/v1/workflow/tasks/my" "Get My Tasks"
test_api "GET" "/api/v1/workflow/tasks/initiated" "Get Initiated Tasks"
test_api "GET" "/api/v1/workflows" "Get Workflow Definitions"
test_api "GET" "/api/v1/workflows/init-defaults" "Get Workflow Defaults"

echo ""
echo "-------------------------------------------"
echo "7. Schedule APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/schedule/events" "Get Schedule Events"
test_api "GET" "/api/v1/schedule/meetings" "Get Meetings"

echo ""
echo "-------------------------------------------"
echo "8. CMS APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/cms/categories" "Get CMS Categories"
test_api "GET" "/api/v1/cms/articles" "Get CMS Articles"
test_api "GET" "/api/v1/cms/public/articles" "Get Public Articles"

echo ""
echo "-------------------------------------------"
echo "9. Website APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/website/deployments" "Get Deployments"
test_api "GET" "/api/v1/website/templates" "Get Templates"

echo ""
echo "-------------------------------------------"
echo "10. GIS APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/gis/customers" "Get GIS Customers"
test_api "GET" "/api/v1/gis/projects" "Get GIS Projects"
test_api "GET" "/api/v1/gis/warehouses" "Get GIS Warehouses"
test_api "GET" "/api/v1/gis/personnel" "Get GIS Personnel"

echo ""
echo "-------------------------------------------"
echo "11. Field Service APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/field/records" "Get Field Records"
test_api "GET" "/api/v1/field/summary" "Get Field Summary"

echo ""
echo "-------------------------------------------"
echo "12. Production Docs APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/production-docs/categories" "Get Production Doc Categories"
test_api "GET" "/api/v1/production-docs/documents" "Get Production Documents"
test_api "GET" "/api/v1/production-docs/documents/for-review" "Get Documents For Review"

echo ""
echo "-------------------------------------------"
echo "13. Materials APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/materials" "Get Materials"

echo ""
echo "-------------------------------------------"
echo "14. Contracts APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/contracts" "Get Contracts"
test_api "GET" "/api/v1/contracts/templates" "Get Contract Templates"

echo ""
echo "-------------------------------------------"
echo "15. Dict APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/dicts/categories" "Get Dict Categories"
test_api "GET" "/api/v1/dicts/items" "Get Dict Items"
test_api "GET" "/api/v1/dicts/all" "Get All Dicts"

echo ""
echo "-------------------------------------------"
echo "16. ERP APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/erp/products" "Get ERP Products"
test_api "GET" "/api/v1/erp/purchase/orders" "Get Purchase Orders"
test_api "GET" "/api/v1/erp/sales/orders" "Get Sales Orders"

echo ""
echo "-------------------------------------------"
echo "17. Help Center APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/help/categories" "Get Help Categories"
test_api "GET" "/api/v1/help/articles" "Get Help Articles"

echo ""
echo "-------------------------------------------"
echo "18. AI APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/ai/status" "AI Status"
test_api "POST" "/api/v1/english-ai/translate" "English AI Translate" '{"text":"Hello","source_lang":"en","target_lang":"zh"}'
test_api "POST" "/api/v1/english-ai/generate-description" "Generate Description" '{"chinese_description":"产品经理","style":"technical"}'

echo ""
echo "-------------------------------------------"
echo "19. Roles & Permissions APIs"
echo "-------------------------------------------"
test_api "GET" "/api/v1/roles" "Get Roles"
test_api "GET" "/api/v1/roles/active" "Get Active Roles"
test_api "GET" "/api/v1/permissions" "Get Permissions"

echo ""
echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo -e "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "\n${YELLOW}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
