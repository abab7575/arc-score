#!/bin/bash
# Paperclip Org Status Dashboard
# Usage: ./scripts/paperclip-status.sh
# Or:    ./scripts/paperclip-status.sh --full  (includes completed issues)

API="http://127.0.0.1:3100/api"
COMPANY_ID="e8dc73a8-e135-44ea-9c0d-2b2e4b23af54"
FULL_MODE="${1:-}"

# Colors
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
BLUE='\033[34m'
CYAN='\033[36m'
MAGENTA='\033[35m'
RESET='\033[0m'

# Check if Paperclip is running
if ! curl -s "$API/health" > /dev/null 2>&1; then
  echo -e "${RED}Paperclip is not running.${RESET} Start it with: npx paperclipai run"
  exit 1
fi

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  ARC REPORT — ORG STATUS${RESET}"
echo -e "${DIM}  $(date '+%A %d %B %Y, %H:%M')${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# Fetch data
AGENTS=$(curl -s "$API/companies/$COMPANY_ID/agents")
ISSUES=$(curl -s "$API/companies/$COMPANY_ID/issues")

# Agent Status
echo ""
echo -e "${BOLD}AGENTS${RESET}"
echo -e "${DIM}────────────────────────────────────────────────${RESET}"

echo "$AGENTS" | python3 -c "
import sys, json
from datetime import datetime, timezone

agents = json.load(sys.stdin)
agents.sort(key=lambda a: a['name'])

for a in agents:
    status = a['status']
    hb = a.get('runtimeConfig', {}).get('heartbeat', {})
    interval = hb.get('intervalSec', 0)
    model = a.get('adapterConfig', {}).get('model', '?')

    if interval >= 3600:
        freq = f'{interval // 3600}hr'
    elif interval >= 60:
        freq = f'{interval // 60}min'
    else:
        freq = f'{interval}s'

    # Status emoji
    if status == 'running':
        icon = '🟢'
    elif status == 'idle':
        icon = '⚪'
    elif status == 'paused':
        icon = '🟡'
    else:
        icon = '🔴'

    # Last heartbeat
    last_hb = a.get('lastHeartbeatAt')
    if last_hb:
        try:
            dt = datetime.fromisoformat(last_hb.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            delta = now - dt
            if delta.total_seconds() < 3600:
                ago = f'{int(delta.total_seconds() // 60)}m ago'
            elif delta.total_seconds() < 86400:
                ago = f'{int(delta.total_seconds() // 3600)}h ago'
            else:
                ago = f'{int(delta.total_seconds() // 86400)}d ago'
        except:
            ago = '?'
    else:
        ago = 'never'

    title = a.get('title') or a['name']
    name = a['name']

    print(f'  {icon} {name:<15} {status:<10} {freq:<6} last: {ago:<8} ({model.split(\"-\")[-1] if \"-\" in model else model})')
"

# Issues
echo ""
echo -e "${BOLD}OPEN ISSUES${RESET}"
echo -e "${DIM}────────────────────────────────────────────────${RESET}"

echo "$ISSUES" | python3 -c "
import sys, json

data = json.load(sys.stdin)
issues = data if isinstance(data, list) else data.get('items', [])

# Build agent lookup
agents_raw = '''$AGENTS'''
agents_list = json.loads(agents_raw)
agent_map = {a['id']: a['name'] for a in agents_list}

# Priority icons
priority_icon = {
    'critical': '🔴',
    'high': '🟠',
    'medium': '🟡',
    'low': '⚪'
}

# Status icons
status_icon = {
    'todo': '⬚',
    'in_progress': '▶',
    'in_review': '👀',
    'blocked': '🚫',
    'done': '✅',
    'cancelled': '✖',
    'backlog': '📋'
}

full_mode = '$FULL_MODE' == '--full'

for i in sorted(issues, key=lambda x: (
    {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}.get(x.get('priority', 'low'), 4),
    x.get('identifier', '')
)):
    status = i['status']
    if status in ('done', 'cancelled') and not full_mode:
        continue

    pri = priority_icon.get(i.get('priority', 'low'), '⚪')
    st = status_icon.get(status, '?')
    assignee = agent_map.get(i.get('assigneeAgentId', ''), 'unassigned')
    ident = i.get('identifier', '?')
    title = i['title'][:60]

    print(f'  {pri} {st} {ident:<7} {assignee:<15} {title}')

# Summary counts
total = len(issues)
done_count = sum(1 for i in issues if i['status'] == 'done')
in_progress = sum(1 for i in issues if i['status'] == 'in_progress')
todo = sum(1 for i in issues if i['status'] == 'todo')
blocked = sum(1 for i in issues if i['status'] == 'blocked')
unassigned = sum(1 for i in issues if not i.get('assigneeAgentId') and i['status'] not in ('done', 'cancelled'))

print()
print(f'  Total: {total} | Done: {done_count} | In Progress: {in_progress} | Todo: {todo} | Blocked: {blocked} | Unassigned: {unassigned}')
"

# Cost summary
echo ""
echo -e "${BOLD}COSTS${RESET}"
echo -e "${DIM}────────────────────────────────────────────────${RESET}"

echo "$AGENTS" | python3 -c "
import sys, json
agents = json.load(sys.stdin)
total = 0
for a in sorted(agents, key=lambda x: x.get('spentMonthlyCents', 0), reverse=True):
    spent = a.get('spentMonthlyCents', 0)
    budget = a.get('budgetMonthlyCents', 0)
    total += spent
    spent_str = f'\${spent/100:.2f}'
    budget_str = f'\${budget/100:.2f}' if budget > 0 else 'unlimited'
    if spent > 0:
        print(f'  {a[\"name\"]:<15} {spent_str:>10} / {budget_str}')

if total > 0:
    print(f'  {\"─\" * 35}')
    print(f'  {\"TOTAL\":<15} \${total/100:.2f}')
else:
    print('  No spend tracked yet')
"

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${DIM}  Paperclip UI: http://127.0.0.1:3100${RESET}"
echo -e "${DIM}  Run with --full to include completed issues${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
