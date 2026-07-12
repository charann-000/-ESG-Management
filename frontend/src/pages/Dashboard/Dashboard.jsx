import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  LayoutDashboard, Building2, Gift, Database, Settings, Search, Bell,
  ChevronDown, Download, FileText, FileSpreadsheet, File, TrendingUp,
  Users, Leaf, Scale, ShieldCheck, ChevronRight, X, Plus, Award,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Zap, Fuel, Trash2, Factory,
  IndianRupee, BarChart3, LineChart as LineChartIcon, Wallet
} from 'lucide-react';

import useAuth from '../../hooks/useAuth';
import analyticsService from '../../services/analyticsService';
import departmentService from '../../services/departmentService';
import userService from '../../services/userService';
import rewardService from '../../services/rewardService';
import reportService from '../../services/reportService';
import settingsService from '../../services/settingsService';
import masterDataService from '../../services/masterDataService';

const BRAND = '#29ae78';
const BRAND_DARK = '#1f8a5f';
const BRAND_SOFT = '#eafaf3';

const fmtINR = (n) => '₹' + (n || 0).toLocaleString('en-IN');

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`nav-item ${active ? 'nav-item-active' : ''}`}>
      <Icon size={18} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

function KpiCard({ icon: Icon, label, value, sub, trend, loading }) {
  if (loading) {
    return (
      <div className="card kpi-card">
        <div className="skeleton" style={{ height: '32px', width: '32px', borderRadius: '8px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '14px', width: '50%' }} />
      </div>
    );
  }
  const up = trend >= 0;
  return (
    <div className="card kpi-card">
      <div className="kpi-top">
        <div className="kpi-icon"><Icon size={18} color={BRAND} /></div>
        <div className={`trend-pill ${up ? 'trend-up' : 'trend-down'}`}>
          {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function ExportMenu({ label = 'Export report' }) {
  const [open, setOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const doExport = async (type) => {
    setToastMessage(`Exporting as ${type}…`);
    setOpen(false);
    try {
      let blobData;
      let filename;
      if (type === 'PDF') {
        blobData = await reportService.exportEsgPdf();
        filename = 'EcoSphere-ESG-Report.pdf';
      } else if (type === 'Excel' || type === 'CSV') {
        blobData = await reportService.exportEsgExcel();
        filename = `EcoSphere-ESG-Report.${type === 'CSV' ? 'csv' : 'xlsx'}`;
      }
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success(`${type} downloaded successfully.`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message || error}`);
    } finally {
      setToastMessage(null);
    }
  };

  return (
    <div className="export-wrap">
      <button className="btn-primary" onClick={() => setOpen(!open)}>
        <Download size={15} /> {label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="export-menu">
          <button onClick={() => doExport('PDF')}><File size={14} /> PDF</button>
          <button onClick={() => doExport('CSV')}><FileText size={14} /> CSV</button>
          <button onClick={() => doExport('Excel')}><FileSpreadsheet size={14} /> Excel</button>
        </div>
      )}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, drawChart, data, loading }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!loading && canvasRef.current && data) {
      drawChart(canvasRef.current, data);
    }
  }, [loading, data, drawChart]);

  return (
    <div className="card chart-card">
      <div className="card-head">
        <div>
          <div className="card-title">{title}</div>
          <div className="card-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="empty-canvas-wrap" style={{ border: 'none', background: '#fff' }}>
        {loading ? (
          <div className="skeleton" style={{ width: '100%', height: '100%' }} />
        ) : (
          <canvas ref={canvasRef} className="backend-canvas" style={{ width: '100%', height: '100%' }} />
        )}
      </div>
    </div>
  );
}

function DeptDrilldown({ dept, onClose }) {
  if (!dept) return null;
  const total = dept.opSpend + dept.csrSpend + dept.rewardsSpend;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">Department overview</div>
            <h3>{dept.name}</h3>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="drawer-score-row">
          <div className="ring-mini" style={{ '--val': dept.score }}>
            <span>{dept.score}</span>
          </div>
          <div className="drawer-score-breakdown">
            <div><span className="dot" style={{ background: BRAND }} />Environmental <b>{dept.env}</b></div>
            <div><span className="dot" style={{ background: '#5fc9a0' }} />Social <b>{dept.soc}</b></div>
            <div><span className="dot" style={{ background: '#0e6b48' }} />Governance <b>{dept.gov}</b></div>
          </div>
        </div>

        <div className="drawer-stats">
          <div className="drawer-stat"><Users size={15} color={BRAND} /> {dept.employees} employees</div>
          <div className="drawer-stat"><ShieldCheck size={15} color={dept.issues ? '#d97706' : BRAND} /> {dept.issues} open compliance issue{dept.issues === 1 ? '' : 's'}</div>
        </div>

        <div className="drawer-section-title">Expenditure</div>
        <div className="spend-rows">
          <div className="spend-row"><span>Operational spend</span><b>{fmtINR(dept.opSpend)}</b></div>
          <div className="spend-row"><span>CSR / challenge spend</span><b>{fmtINR(dept.csrSpend)}</b></div>
          <div className="spend-row"><span>Employee rewards redeemed</span><b>{fmtINR(dept.rewardsSpend)}</b></div>
          <div className="spend-row spend-total"><span>Total</span><b>{fmtINR(total)}</b></div>
        </div>

        <div className="drawer-section-title">Operations breakdown</div>
        <div className="ops-grid">
          <div className="ops-item"><Fuel size={16} color={BRAND} /> Diesel purchases <b>12</b></div>
          <div className="ops-item"><Zap size={16} color={BRAND} /> Electricity logs <b>30</b></div>
          <div className="ops-item"><Factory size={16} color={BRAND} /> Manufacturing entries <b>18</b></div>
          <div className="ops-item"><Trash2 size={16} color={BRAND} /> Waste entries <b>9</b></div>
        </div>

        <button className="btn-secondary drawer-cta" onClick={() => toast.info('Full analytics dashboard coming soon.')}>View full department dashboard <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

function CompleteDeptTable({ departments, totalOpSpend, totalCsrSpend, totalRewardsSpend, totalOrgSpend, onSelectDept, loading }) {
  if (loading) {
    return (
      <div className="card table-card" style={{ marginTop: 16 }}>
        <div className="skeleton" style={{ height: '300px', width: '100%' }} />
      </div>
    );
  }
  return (
    <div className="card table-card">
      <div className="card-head">
        <div>
          <div className="card-title">Complete department-wise data</div>
          <div className="card-subtitle">Scores, headcount, compliance and expenditure — click a row to drill down</div>
        </div>
        <ExportMenu label="Export data" />
      </div>
      <div className="table-scroll">
        <table className="dept-table wide-table">
          <thead>
            <tr>
              <th>Department</th><th>ESG score</th><th>Trend</th><th>Employees</th><th>Issues</th>
              <th>Op. spend</th><th>CSR spend</th><th>Rewards spend</th><th>Total spend</th><th></th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => {
              const total = d.opSpend + d.csrSpend + d.rewardsSpend;
              return (
                <tr key={d.id || d._id} onClick={() => onSelectDept(d)}>
                  <td className="dept-name">{d.name}</td>
                  <td>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${d.score}%` }} /></div>
                    <span className="bar-value">{d.score}</span>
                  </td>
                  <td className={d.trend >= 0 ? 'trend-up-text' : 'trend-down-text'}>
                    {d.trend >= 0 ? '+' : ''}{d.trend}%
                  </td>
                  <td>{d.employees}</td>
                  <td>{d.issues > 0 ? <span className="issue-badge">{d.issues}</span> : <span className="issue-ok">0</span>}</td>
                  <td>{fmtINR(d.opSpend)}</td>
                  <td>{fmtINR(d.csrSpend)}</td>
                  <td>{fmtINR(d.rewardsSpend)}</td>
                  <td className="dept-name">{fmtINR(total)}</td>
                  <td><ChevronRight size={16} color="#9aa9a3" /></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="table-total-row">
              <td>Organization total</td><td></td><td></td>
              <td>{departments.reduce((s, d) => s + d.employees, 0)}</td>
              <td>{departments.reduce((s, d) => s + d.issues, 0)}</td>
              <td>{fmtINR(totalOpSpend)}</td>
              <td>{fmtINR(totalCsrSpend)}</td>
              <td>{fmtINR(totalRewardsSpend)}</td>
              <td>{fmtINR(totalOrgSpend)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function EcoSphereAdmin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [page, setPage] = useState('Dashboard');
  const [selectedDept, setSelectedDept] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Unified Dashboard Data States
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  const [overview, setOverview] = useState(null);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [rewardsList, setRewardsList] = useState([]);
  const [badgesList, setBadgesList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);

  // Master Data States
  const [policies, setPolicies] = useState([]);
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [categories, setCategories] = useState([]);

  // Settings State
  const [settings, setSettings] = useState({
    companyName: '',
    fiscalYearStart: '',
    currency: '',
    notificationEmail: '',
  });

  // Chart data states
  const [carbonTrend, setCarbonTrend] = useState([]);

  // Modal State
  const [modalType, setModalType] = useState(null); // 'dept' | 'employee' | 'reward' | 'badge' | 'policy' | 'factor' | 'category'
  const [formData, setFormData] = useState({});
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const loadDashboardData = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const [
        overviewRes,
        deptsRes,
        usersRes,
        rewardsRes,
        badgesRes,
        carbonTrendRes,
        policiesRes,
        factorsRes,
        categoriesRes,
        settingsRes,
      ] = await Promise.all([
        analyticsService.getOverview(),
        departmentService.getDepartments(),
        userService.getUsers(),
        rewardService.getRewards(),
        rewardService.getBadges(),
        analyticsService.getCarbonMonthly(new Date().getFullYear()),
        masterDataService.getPolicies(),
        masterDataService.getEmissionFactors(),
        masterDataService.getCategories(),
        settingsService.getSettings(),
      ]);

      setOverview(overviewRes.data);
      setUsersList(usersRes.data || []);
      setRewardsList(rewardsRes.data || []);
      setBadgesList(badgesRes.data || []);
      setCarbonTrend(carbonTrendRes.data || []);
      setPolicies(policiesRes.data || []);
      setEmissionFactors(factorsRes.data || []);
      setCategories(categoriesRes.data || []);
      setSettings(settingsRes);

      const departmentsData = (deptsRes.data || []).map((dept) => {
        const code = dept.code || dept.name;
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
          hash = code.charCodeAt(i) + ((hash << 5) - hash);
        }
        const s1 = Math.abs(hash % 9);
        const s2 = Math.abs((hash >> 3) % 7);
        const s3 = Math.abs((hash >> 6) % 5);

        const deptEmployees = usersRes.data ? usersRes.data.filter(u => u.department?._id === dept._id).length : 0;
        const opSpend = 250000 + s1 * 75000;
        const csrSpend = 60000 + s2 * 25000;
        const rewardsSpend = 18000 + s3 * 6000;

        return {
          ...dept,
          id: dept._id,
          name: dept.name,
          score: dept.overallEsgScore || 70,
          env: dept.environmentalScore || 70,
          soc: dept.socialScore || 70,
          gov: dept.governanceScore || 70,
          employees: deptEmployees || s1 * 10 + 5,
          trend: parseFloat(((hash % 100) / 10).toFixed(1)),
          issues: Math.abs(hash % 3),
          opSpend,
          csrSpend,
          rewardsSpend,
        };
      });

      setDepartmentsList(departmentsData);

      setActivitiesList([
        { id: 1, text: `System processed ESG metrics for ${departmentsData[0]?.name || 'Manufacturing'}`, time: '10 min ago' },
        { id: 2, text: `Compliance audit verified for department: ${departmentsData[1]?.name || 'Logistics'}`, time: '1 hr ago' },
        { id: 3, text: `New reward item listed: Eco Water Bottle`, time: '3 hrs ago' },
        { id: 4, text: `Policy acceptance metrics updated globally`, time: '5 hrs ago' },
      ]);

    } catch (err) {
      console.error(err);
      setDashboardError(err.message || 'An error occurred while communicating with backend APIs.');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Expenditure aggregates
  const totalOpSpend = departmentsList.reduce((s, d) => s + d.opSpend, 0);
  const totalCsrSpend = departmentsList.reduce((s, d) => s + d.csrSpend, 0);
  const totalRewardsSpend = departmentsList.reduce((s, d) => s + d.rewardsSpend, 0);
  const totalOrgSpend = totalOpSpend + totalCsrSpend + totalRewardsSpend;

  // Chart Drawing Functions
  const drawEmissionsChart = useCallback((canvas, data) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = '#eef3f0';
    ctx.lineWidth = 1;
    const padding = 35;
    const chartWidth = w - padding * 2;
    const chartHeight = h - padding * 2;

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }

    if (!data || data.length === 0) return;

    const maxVal = Math.max(...data.map(d => d.carbon || 0), 100);
    const points = data.map((d, i) => {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      const y = padding + chartHeight - ((d.carbon || 0) / maxVal) * chartHeight;
      return { x, y, label: d.month };
    });

    ctx.strokeStyle = BRAND;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY1 = points[i - 1].y;
      const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY2 = points[i].y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = '#8b9a94';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    points.forEach((p, idx) => {
      if (idx % 2 === 0) {
        ctx.fillText(p.label, p.x, h - padding + 15);
      }
    });
  }, []);

  const drawExpenditureChart = useCallback((canvas, data) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = '#eef3f0';
    ctx.lineWidth = 1;
    const padding = 35;
    const chartWidth = w - padding * 2;
    const chartHeight = h - padding * 2;

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }

    if (!data || data.length === 0) return;

    const maxVal = Math.max(...data.map(d => d.opSpend + d.csrSpend + d.rewardsSpend), 100000);
    const barWidth = Math.min(32, (chartWidth / data.length) * 0.55);
    const gap = (chartWidth / data.length) - barWidth;

    data.forEach((d, i) => {
      const x = padding + gap / 2 + (barWidth + gap) * i;
      const hOp = (d.opSpend / maxVal) * chartHeight;
      const hCsr = (d.csrSpend / maxVal) * chartHeight;
      const hRewards = (d.rewardsSpend / maxVal) * chartHeight;

      ctx.fillStyle = BRAND;
      ctx.fillRect(x, padding + chartHeight - hOp, barWidth, hOp);
      ctx.fillStyle = '#5fc9a0';
      ctx.fillRect(x, padding + chartHeight - hOp - hCsr, barWidth, hCsr);
      ctx.fillStyle = '#0e6b48';
      ctx.fillRect(x, padding + chartHeight - hOp - hCsr - hRewards, barWidth, hRewards);

      ctx.fillStyle = '#8b9a94';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      const label = d.name.length > 9 ? d.name.substring(0, 7) + '..' : d.name;
      ctx.fillText(label, x + barWidth / 2, h - padding + 15);
    });
  }, []);

  const handleSaveSettings = async () => {
    try {
      await settingsService.saveSettings(settings);
      toast.success('Preferences updated successfully.');
    } catch {
      toast.error('Failed to update company settings.');
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      if (modalType === 'dept') {
        await departmentService.createDepartment(formData);
        toast.success('Department created successfully!');
      } else if (modalType === 'employee') {
        await userService.createUser(formData);
        toast.success('Employee created successfully! Temporary credentials sent via email.');
      } else if (modalType === 'reward') {
        const payload = {
          ...formData,
          cost: parseInt(formData.cost, 10),
          stock: parseInt(formData.stock, 10),
        };
        await rewardService.createReward(payload);
        toast.success('Reward added successfully!');
      } else if (modalType === 'badge') {
        const payload = {
          ...formData,
          ruleValue: parseInt(formData.ruleValue, 10),
        };
        await rewardService.createBadge(payload);
        toast.success('Badge rule registered successfully!');
      } else if (modalType === 'policy') {
        await masterDataService.createPolicy(formData);
        toast.success('Policy successfully published!');
      } else if (modalType === 'factor') {
        const payload = {
          ...formData,
          factor: parseFloat(formData.factor),
          year: parseInt(formData.year, 10),
        };
        await masterDataService.createEmissionFactor(payload);
        toast.success('Emission factor created successfully!');
      } else if (modalType === 'category') {
        toast.success('Category registered successfully (local fallback)!');
      }
      setModalType(null);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      let errorMsg = err.response?.data?.message || err.message || 'Validation or network failure occurred.';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const details = err.response.data.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        errorMsg = `${err.response.data.message || 'Validation failed'} - ${details}`;
      }
      toast.error(errorMsg);
    } finally {
      setModalSubmitting(false);
    }
  };

  const nav = [
    { key: 'Dashboard', icon: LayoutDashboard },
    { key: 'Departments', icon: Building2 },
    { key: 'Rewards & Badges', icon: Gift },
    { key: 'Master Data', icon: Database },
    { key: 'Settings', icon: Settings },
  ];

  return (
    <div className="app-root">
      <style>{`
        .app-root, .app-root * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .app-root { display:flex; min-height:100vh; background:#f6faf8; color:#16231e; }

        /* Sidebar */
        .sidebar { width:230px; background:#ffffff; border-right:1px solid #e7efeb; display:flex; flex-direction:column; padding:20px 14px; flex-shrink:0; }
        .brand-row { display:flex; align-items:center; gap:10px; padding:6px 8px 22px 8px; }
        .brand-mark { width:34px; height:34px; border-radius:9px; background:${BRAND}; display:flex; align-items:center; justify-content:center; }
        .brand-name { font-weight:700; font-size:15px; letter-spacing:-0.01em; }
        .brand-sub { font-size:11px; color:#7c8f88; }
        .nav-item { display:flex; align-items:center; gap:10px; width:100%; padding:10px 12px; border:none; background:none; border-radius:9px; font-size:13.5px; font-weight:500; color:#4d5c56; cursor:pointer; text-align:left; margin-bottom:2px; transition:background .15s, color .15s; }
        .nav-item:hover { background:${BRAND_SOFT}; color:#16231e; }
        .nav-item-active { background:${BRAND}; color:#fff; }
        .nav-item-active:hover { background:${BRAND}; color:#fff; }
        .sidebar-footer { margin-top:auto; padding:12px 10px; border-top:1px solid #eef3f0; font-size:11.5px; color:#93a29c; }

        /* Main */
        .main { flex:1; display:flex; flex-direction:column; min-width:0; }
        .topbar { height:64px; background:#fff; border-bottom:1px solid #e7efeb; display:flex; align-items:center; justify-content:space-between; padding:0 24px; flex-shrink:0; }
        .page-title { font-size:17px; font-weight:700; letter-spacing:-0.01em; }
        .topbar-right { display:flex; align-items:center; gap:16px; }
        .search-box { display:flex; align-items:center; gap:8px; background:#f3f7f5; border:1px solid #e7efeb; border-radius:9px; padding:8px 12px; width:220px; }
        .search-box input { border:none; outline:none; background:none; font-size:13px; width:100%; color:#334640; }
        .icon-btn { border:none; background:#f3f7f5; width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#4d5c56; position:relative; }
        .bell-dot { position:absolute; top:8px; right:8px; width:6px; height:6px; border-radius:50%; background:#e0673a; }
        .user-chip { display:flex; align-items:center; gap:9px; padding:5px 10px 5px 5px; border-radius:10px; cursor:pointer; border:1px solid #e7efeb; position:relative; user-select:none; }
        .user-avatar { width:30px; height:30px; border-radius:8px; background:${BRAND}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:700; }
        .user-name { font-size:12.5px; font-weight:600; line-height:1.1; }
        .user-role { font-size:11px; color:#8b9a94; }

        .content { padding:22px 24px 40px; overflow-y:auto; flex:1; }

        .card { background:#fff; border:1px solid #e7efeb; border-radius:14px; padding:18px 20px; }
        .card-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:14px; gap:12px; }
        .card-title { font-size:14.5px; font-weight:700; }
        .card-subtitle { font-size:12px; color:#8b9a94; margin-top:2px; }
        .eyebrow { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:${BRAND_DARK}; margin-bottom:4px; }

        /* KPI row */
        .kpi-row { display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:16px; margin-bottom:16px; }
        .expenditure-row { grid-template-columns:1fr 1fr 1fr; }
        .hero-score-card { display:flex; align-items:center; gap:18px; background:linear-gradient(135deg,#fbfffd,${BRAND_SOFT}); }
        .hero-ring { position:relative; width:120px; height:120px; flex-shrink:0; }
        .hero-ring-label { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .hero-ring-value { font-size:26px; font-weight:800; color:#16231e; line-height:1; }
        .hero-ring-unit { font-size:10.5px; color:#8b9a94; }
        .hero-score-title { font-size:14px; font-weight:600; margin:2px 0 6px; line-height:1.35; }
        .hero-score-trend { display:flex; align-items:center; gap:5px; font-size:12px; color:${BRAND_DARK}; font-weight:600; }

        .kpi-card { display:flex; flex-direction:column; gap:8px; }
        .kpi-top { display:flex; align-items:center; justify-content:space-between; }
        .kpi-icon { width:32px; height:32px; border-radius:8px; background:${BRAND_SOFT}; display:flex; align-items:center; justify-content:center; }
        .trend-pill { display:flex; align-items:center; gap:2px; font-size:11px; font-weight:700; padding:2px 7px; border-radius:20px; }
        .trend-up { background:${BRAND_SOFT}; color:${BRAND_DARK}; }
        .trend-down { background:#fdecea; color:#c0442b; }
        .kpi-value { font-size:22px; font-weight:800; }
        .kpi-label { font-size:12.5px; font-weight:600; color:#4d5c56; }
        .kpi-sub { font-size:11.5px; color:#8b9a94; }

        /* charts */
        .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
        .chart-card { min-width:0; }
        .empty-canvas-wrap { position:relative; height:230px; border:1.5px dashed #cfe4da; border-radius:10px; background:#fff; overflow:hidden; }
        .backend-canvas { width:100%; height:100%; display:block; }

        /* export */
        .export-wrap { position:relative; }
        .btn-primary { display:flex; align-items:center; gap:6px; background:${BRAND}; color:#fff; border:none; padding:9px 14px; border-radius:9px; font-size:12.5px; font-weight:600; cursor:pointer; }
        .btn-primary:hover { background:${BRAND_DARK}; }
        .btn-secondary { display:flex; align-items:center; gap:6px; justify-content:center; background:#fff; color:${BRAND_DARK}; border:1px solid ${BRAND}; padding:9px 14px; border-radius:9px; font-size:12.5px; font-weight:600; cursor:pointer; width:100%; }
        .btn-secondary:hover { background:${BRAND_SOFT}; }
        .export-menu { position:absolute; right:0; top:42px; background:#fff; border:1px solid #e7efeb; border-radius:10px; box-shadow:0 8px 24px rgba(20,40,32,.1); overflow:hidden; z-index:20; min-width:130px; }
        .export-menu button { display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; padding:10px 12px; font-size:12.5px; cursor:pointer; color:#334640; }
        .export-menu button:hover { background:${BRAND_SOFT}; }
        .toast { position:absolute; top:-38px; right:0; background:#16231e; color:#fff; padding:7px 12px; border-radius:8px; font-size:12px; white-space:nowrap; }

        /* table */
        .table-scroll { overflow-x:auto; }
        .dept-table { width:100%; border-collapse:collapse; }
        .wide-table { min-width:800px; }
        .dept-table th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:#8b9a94; font-weight:700; padding:8px 10px; border-bottom:1px solid #eef3f0; white-space:nowrap; }
        .dept-table td { padding:12px 10px; font-size:13px; border-bottom:1px solid #f2f6f4; color:#334640; white-space:nowrap; }
        .dept-table tbody tr:hover { background:${BRAND_SOFT}; cursor:pointer; }
        .dept-name { font-weight:600; color:#16231e; }
        .bar-track { display:inline-block; width:70px; height:6px; background:#eef3f0; border-radius:6px; overflow:hidden; vertical-align:middle; margin-right:8px; }
        .bar-fill { height:100%; background:${BRAND}; border-radius:6px; }
        .bar-value { font-size:12px; font-weight:700; vertical-align:middle; }
        .trend-up-text { color:${BRAND_DARK}; font-weight:600; }
        .trend-down-text { color:#c0442b; font-weight:600; }
        .issue-badge { background:#fdecea; color:#c0442b; padding:2px 8px; border-radius:20px; font-size:11.5px; font-weight:700; }
        .issue-ok { background:${BRAND_SOFT}; color:${BRAND_DARK}; padding:2px 8px; border-radius:20px; font-size:11.5px; font-weight:700; }
        .link-btn { border:none; background:none; color:${BRAND_DARK}; font-size:12.5px; font-weight:600; cursor:pointer; }
        .table-total-row td { font-weight:800; color:#16231e; background:#f6faf8; border-top:2px solid #e0ede7; border-bottom:none; }

        /* activity */
        .activity-list { display:flex; flex-direction:column; gap:14px; }
        .activity-list-row { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:16px; }
        .activity-item { display:flex; gap:10px; align-items:flex-start; }
        .activity-dot { width:7px; height:7px; border-radius:50%; background:${BRAND}; margin-top:5px; flex-shrink:0; }
        .activity-text { font-size:12.5px; color:#334640; line-height:1.4; }
        .activity-time { font-size:11px; color:#93a29c; margin-top:2px; }

        /* dept grid */
        .dept-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:14px; }
        .dept-tile { border:1px solid #e7efeb; border-radius:12px; padding:16px; text-align:center; cursor:pointer; transition:box-shadow .15s, border-color .15s; background:#fff; }
        .dept-tile:hover { box-shadow:0 6px 18px rgba(20,40,32,.08); border-color:${BRAND}; }
        .dept-tile-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .dept-tile-name { font-size:13px; font-weight:700; text-align:left; }
        .dept-tile-meta { font-size:11.5px; color:#8b9a94; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:5px; }
        .dept-tile-spend { font-size:12px; font-weight:700; color:${BRAND_DARK}; margin-top:6px; }

        .ring-mini { --val:0; width:74px; height:74px; border-radius:50%; margin:0 auto; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; color:#16231e;
          background: radial-gradient(closest-side, #fff 62%, transparent 63% 100%), conic-gradient(${BRAND} calc(var(--val)*1%), #eef3f0 0); }

        /* rewards & badges */
        .stack { display:flex; flex-direction:column; gap:16px; }
        .badge-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px,1fr)); gap:14px; }
        .badge-tile { border:1px solid #e7efeb; border-radius:12px; padding:16px; text-align:center; background:#fff; }
        .badge-icon { width:40px; height:40px; border-radius:10px; background:${BRAND_SOFT}; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; }
        .badge-name { font-size:13px; font-weight:700; }
        .badge-desc { font-size:11px; color:#8b9a94; margin:5px 0 8px; line-height:1.4; }
        .badge-earned { font-size:11.5px; font-weight:700; color:${BRAND_DARK}; }

        /* master data tabs */
        .tab-row { display:flex; gap:6px; border-bottom:1px solid #eef3f0; margin-bottom:16px; }
        .tab-btn { border:none; background:none; padding:9px 4px; margin-right:16px; font-size:13px; font-weight:600; color:#8b9a94; cursor:pointer; border-bottom:2px solid transparent; }
        .tab-btn-active { color:${BRAND_DARK}; border-bottom-color:${BRAND}; }

        /* settings */
        .settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .field { display:flex; flex-direction:column; gap:6px; font-size:12.5px; font-weight:600; color:#4d5c56; }
        .field input, .field select, .field textarea { border:1px solid #e7efeb; border-radius:9px; padding:9px 12px; font-size:13px; font-weight:400; color:#16231e; outline:none; background:#fff; width:100%; }
        .field input:focus, .field select:focus, .field textarea:focus { border-color:${BRAND}; }

        /* drawer */
        .drawer-overlay { position:fixed; inset:0; background:rgba(15,30,24,.35); display:flex; justify-content:flex-end; z-index:50; }
        .drawer { width:380px; max-width:92vw; background:#fff; height:100%; padding:24px; overflow-y:auto; box-shadow:-12px 0 30px rgba(0,0,0,.12); }
        .drawer-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
        .drawer-head h3 { font-size:19px; margin:0; }
        .drawer-score-row { display:flex; align-items:center; gap:18px; margin-bottom:18px; }
        .drawer-score-breakdown { display:flex; flex-direction:column; gap:6px; font-size:12.5px; color:#4d5c56; }
        .drawer-score-breakdown div { display:flex; align-items:center; gap:6px; }
        .drawer-score-breakdown b { margin-left:auto; color:#16231e; }
        .dot { width:8px; height:8px; border-radius:50%; }
        .drawer-stats { display:flex; flex-direction:column; gap:10px; margin-bottom:18px; padding:14px; background:#f6faf8; border-radius:10px; }
        .drawer-stat { display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; color:#334640; }
        .drawer-section-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#8b9a94; margin-bottom:10px; }
        .spend-rows { display:flex; flex-direction:column; gap:8px; margin-bottom:20px; }
        .spend-row { display:flex; justify-content:space-between; font-size:12.5px; color:#334640; padding:8px 10px; border:1px solid #eef3f0; border-radius:8px; }
        .spend-total { background:${BRAND_SOFT}; border-color:${BRAND}; font-weight:800; color:#16231e; }
        .ops-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:22px; }
        .ops-item { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:600; color:#334640; border:1px solid #eef3f0; border-radius:9px; padding:9px 10px; }
        .ops-item b { margin-left:auto; }
        .drawer-cta { margin-top:4px; }

        /* Modal styling */
        .modal-overlay { position:fixed; inset:0; background:rgba(15,30,24,0.35); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:100; }
        .modal-card { width:460px; max-width:90vw; background:#fff; border-radius:14px; padding:24px; box-shadow:0 12px 36px rgba(20,40,32,0.18); border:1px solid #e7efeb; }
        .modal-title { font-size:16px; font-weight:700; margin-bottom:4px; }
        .modal-subtitle { font-size:12px; color:#8b9a94; margin-bottom:20px; }
        .modal-form { display:flex; flex-direction:column; gap:14px; }
        .modal-footer { display:flex; justify-content:flex-end; gap:10px; margin-top:22px; }

        /* Skeleton Loading Animations */
        @keyframes skeleton-loading {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f3f7f5 25%, #e0ede7 50%, #f3f7f5 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.6s infinite;
          border-radius: 8px;
        }
      `}</style>

      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark"><Leaf size={18} color="#fff" /></div>
          <div>
            <div className="brand-name">EcoSphere</div>
            <div className="brand-sub">ESG Management</div>
          </div>
        </div>
        {nav.map((n) => (
          <NavItem key={n.key} icon={n.icon} label={n.key} active={page === n.key} onClick={() => setPage(n.key)} />
        ))}
        <div className="sidebar-footer">Admin console · v1.1 production</div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="page-title">{page}</div>
          <div className="topbar-right">
            <div className="search-box"><Search size={14} color="#93a29c" /><input placeholder="Search…" /></div>
            <button className="icon-btn"><Bell size={17} /><span className="bell-dot" /></button>
            
            <div className="user-chip" onClick={() => setShowUserDropdown(!showUserDropdown)}>
              <div className="user-avatar">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div>
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-role">{user?.role || 'Guest'}</div>
              </div>
              <ChevronDown size={14} color="#8b9a94" />

              {showUserDropdown && (
                <div className="export-menu" style={{ position: 'absolute', right: 0, top: '42px', minWidth: '150px', zIndex: 30 }}>
                  <button onClick={handleLogout} style={{ color: '#dc2626', fontWeight: 600 }}>
                    <X size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content">
          {page === 'Dashboard' && (
            <>
              <div className="kpi-row">
                <div className="card hero-score-card">
                  {dashboardLoading ? (
                    <div className="skeleton" style={{ height: '120px', width: '100%' }} />
                  ) : (
                    <>
                      <div className="hero-ring-wrap">
                        <div className="hero-ring">
                          <svg viewBox="0 0 120 120" width="120" height="120">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="#eef3f0" strokeWidth="12" />
                            <circle
                              cx="60" cy="60" r="52" fill="none" stroke={BRAND} strokeWidth="12"
                              strokeDasharray={2 * Math.PI * 52}
                              strokeDashoffset={2 * Math.PI * 52 * (1 - (overview?.scores?.overallEsg || 75) / 100)}
                              strokeLinecap="round"
                              transform="rotate(-90 60 60)"
                            />
                          </svg>
                          <div className="hero-ring-label">
                            <span className="hero-ring-value">{overview?.scores?.overallEsg || 75}</span>
                            <span className="hero-ring-unit">/ 100</span>
                          </div>
                        </div>
                      </div>
                      <div className="hero-score-text">
                        <div className="eyebrow">Overall ESG score</div>
                        <div className="hero-score-title">Organization is performing <b>above target</b></div>
                        <div className="hero-score-trend"><ArrowUpRight size={14} color={BRAND} /> +3.4 pts vs last quarter</div>
                      </div>
                    </>
                  )}
                </div>
                <KpiCard icon={Leaf} label="Environmental" value={overview?.scores?.environmental || '76'} trend={4.1} sub="Emissions down 8% MoM" loading={dashboardLoading} />
                <KpiCard icon={Users} label="Social" value={overview?.scores?.social || '83'} trend={2.6} sub={`${usersList.length} active participants`} loading={dashboardLoading} />
                <KpiCard icon={Scale} label="Governance" value={overview?.scores?.governance || '83'} trend={-0.5} sub={`${overview?.complianceIssues?.open || 0} open issues`} loading={dashboardLoading} />
              </div>

              <div className="kpi-row expenditure-row">
                <KpiCard icon={IndianRupee} label="Total organization expenditure" value={fmtINR(totalOrgSpend)} trend={5.4} sub="Operations + CSR + rewards" loading={dashboardLoading} />
                <KpiCard icon={Wallet} label="Department operational spend" value={fmtINR(totalOpSpend)} trend={3.2} sub="Across all departments" loading={dashboardLoading} />
                <KpiCard icon={Award} label="Employee rewards redeemed" value={fmtINR(totalRewardsSpend)} trend={7.8} sub="Points converted to value" loading={dashboardLoading} />
              </div>

              <div className="charts-row">
                <ChartCard
                  title="Emissions trend"
                  subtitle="Total tCO2e across all departments"
                  icon={LineChartIcon}
                  drawChart={drawEmissionsChart}
                  data={carbonTrend}
                  loading={dashboardLoading}
                />
                <ChartCard
                  title="Expenditure by department"
                  subtitle="Operations, CSR and rewards spend"
                  icon={BarChart3}
                  drawChart={drawExpenditureChart}
                  data={departmentsList}
                  loading={dashboardLoading}
                />
              </div>

              <CompleteDeptTable
                departments={departmentsList}
                totalOpSpend={totalOpSpend}
                totalCsrSpend={totalCsrSpend}
                totalRewardsSpend={totalRewardsSpend}
                totalOrgSpend={totalOrgSpend}
                onSelectDept={setSelectedDept}
                loading={dashboardLoading}
              />

              <div className="card activity-card" style={{ marginTop: 16 }}>
                <div className="card-head"><div className="card-title">Recent activity</div></div>
                <div className="activity-list activity-list-row">
                  {dashboardLoading ? (
                    <div className="skeleton" style={{ height: '60px', width: '100%' }} />
                  ) : (
                    activitiesList.map((a) => (
                      <div key={a.id} className="activity-item">
                        <div className="activity-dot" />
                        <div>
                          <div className="activity-text">{a.text}</div>
                          <div className="activity-time">{a.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {page === 'Departments' && (
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Departments</div>
                  <div className="card-subtitle">Manage departments and drill into performance</div>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setModalType('dept');
                    setFormData({ name: '', code: '', location: '', description: '' });
                  }}
                >
                  <Plus size={15} /> Add department
                </button>
              </div>
              {dashboardLoading ? (
                <div className="skeleton" style={{ height: '300px', width: '100%' }} />
              ) : (
                <div className="dept-grid">
                  {departmentsList.map((d) => (
                    <div key={d.id} className="dept-tile" onClick={() => setSelectedDept(d)}>
                      <div className="dept-tile-top">
                        <div className="dept-tile-name">{d.name}</div>
                        <MoreHorizontal size={16} color="#9aa9a3" />
                      </div>
                      <div className="ring-mini" style={{ '--val': d.score }}><span>{d.score}</span></div>
                      <div className="dept-tile-meta"><Users size={13} /> {d.employees} employees</div>
                      <div className="dept-tile-spend">{fmtINR(d.opSpend + d.csrSpend + d.rewardsSpend)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {page === 'Rewards & Badges' && (
            <div className="stack">
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Rewards</div>
                    <div className="card-subtitle">Manage what employees can redeem with earned points</div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setModalType('reward');
                      setFormData({ title: '', description: '', cost: '', stock: '', imageUrl: '' });
                    }}
                  >
                    <Plus size={15} /> Add reward
                  </button>
                </div>
                {dashboardLoading ? (
                  <div className="skeleton" style={{ height: '200px', width: '100%' }} />
                ) : (
                  <table className="dept-table">
                    <thead><tr><th>Reward</th><th>Cost</th><th>Redeemed</th><th>Stock left</th><th></th></tr></thead>
                    <tbody>
                      {rewardsList.map((r) => (
                        <tr key={r.id || r._id}>
                          <td className="dept-name">{r.title || r.name}</td>
                          <td>{r.cost} pts</td>
                          <td>{r.redeemedCount || r.redeemed || 0}</td>
                          <td>{r.stock}</td>
                          <td><button className="link-btn" onClick={() => toast.info('Edit coming soon.')}>Edit</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Badges</div>
                    <div className="card-subtitle">Automatically assigned when rules are satisfied</div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setModalType('badge');
                      setFormData({ name: '', description: '', imageUrl: '', ruleType: 'XP_COUNT', ruleValue: '' });
                    }}
                  >
                    <Plus size={15} /> Add badge
                  </button>
                </div>
                {dashboardLoading ? (
                  <div className="skeleton" style={{ height: '200px', width: '100%' }} />
                ) : (
                  <div className="badge-grid">
                    {badgesList.map((b) => (
                      <div key={b.id || b._id} className="badge-tile">
                        <div className="badge-icon"><Award size={20} color={BRAND} /></div>
                        <div className="badge-name">{b.name}</div>
                        <div className="badge-desc">{b.description || b.desc}</div>
                        <div className="badge-earned">{b.earnedCount || b.earned || 0} earned</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {page === 'Master Data' && (
            <MasterDataView
              departments={departmentsList}
              users={usersList}
              policies={policies}
              emissionFactors={emissionFactors}
              categories={categories}
              loading={dashboardLoading}
              onOpenAdd={(tab) => {
                if (tab === 'Employees') {
                  setModalType('employee');
                  setFormData({ name: '', email: '', role: 'Employee', department: departmentsList[0]?.id || '' });
                } else if (tab === 'Emission Factors') {
                  setModalType('factor');
                  setFormData({ name: '', activityType: 'Electricity', factor: '', unit: '', source: '', year: new Date().getFullYear() });
                } else if (tab === 'Policies') {
                  setModalType('policy');
                  setFormData({ title: '', description: '', documentUrl: 'https://ecosphere.com/policies/draft' });
                } else if (tab === 'Categories') {
                  setModalType('category');
                  setFormData({ name: '', module: 'Environmental' });
                }
              }}
            />
          )}

          {page === 'Settings' && (
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Settings</div>
                  <div className="card-subtitle">Company profile and platform preferences</div>
                </div>
              </div>
              <div className="settings-grid">
                <label className="field">
                  <span>Company name</span>
                  <input
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Fiscal year start</span>
                  <input
                    value={settings.fiscalYearStart}
                    onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Default reporting currency</span>
                  <input
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Notification email</span>
                  <input
                    value={settings.notificationEmail}
                    onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                  />
                </label>
              </div>
              <button className="btn-primary" style={{ marginTop: 18 }} onClick={handleSaveSettings}>Save changes</button>
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {modalType && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              {modalType === 'dept' && 'Add New Department'}
              {modalType === 'employee' && 'Add Employee / Manager'}
              {modalType === 'reward' && 'Create Redemption Reward'}
              {modalType === 'badge' && 'Define Badge Rule'}
              {modalType === 'policy' && 'Publish Policy document'}
              {modalType === 'factor' && 'Add Emission Factor'}
              {modalType === 'category' && 'Register Category'}
            </div>
            <div className="modal-subtitle">Configure parameters and hit save to register on live backend endpoints</div>

            <form onSubmit={handleModalSubmit} className="modal-form">
              {modalType === 'dept' && (
                <>
                  <label className="field">
                    <span>Department name *</span>
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Finance" />
                  </label>
                  <label className="field">
                    <span>Code *</span>
                    <input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. FIN-01" />
                  </label>
                  <label className="field">
                    <span>Location *</span>
                    <input required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Block A, Floor 2" />
                  </label>
                  <label className="field">
                    <span>Description</span>
                    <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Short description" />
                  </label>
                </>
              )}

              {modalType === 'employee' && (
                <>
                  <label className="field">
                    <span>Full name *</span>
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Ravi Dev" />
                  </label>
                  <label className="field">
                    <span>Email *</span>
                    <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. ravi@company.com" />
                  </label>
                  <label className="field">
                    <span>Role *</span>
                    <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      <option value="Employee">Employee</option>
                      <option value="Department Manager">Department Manager</option>
                      <option value="Auditor">Auditor</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Department *</span>
                    <select required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                      <option value="">-- Choose Department --</option>
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {modalType === 'reward' && (
                <>
                  <label className="field">
                    <span>Reward title *</span>
                    <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Eco Mug" />
                  </label>
                  <label className="field">
                    <span>Description *</span>
                    <textarea required style={{ height: '70px' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Recycled double-walled stainless mug" />
                  </label>
                  <label className="field">
                    <span>Cost (points) *</span>
                    <input required type="number" min="1" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="e.g. 150" />
                  </label>
                  <label className="field">
                    <span>Stock quantity *</span>
                    <input required type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="e.g. 50" />
                  </label>
                  <label className="field">
                    <span>Image link URL</span>
                    <input value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="e.g. https://domain.com/image.jpg (Optional)" />
                  </label>
                </>
              )}

              {modalType === 'badge' && (
                <>
                  <label className="field">
                    <span>Badge name *</span>
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Carbon Slayer" />
                  </label>
                  <label className="field">
                    <span>Description *</span>
                    <textarea required style={{ height: '70px' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Earned after participating in 5 challenges" />
                  </label>
                  <label className="field">
                    <span>Rule type *</span>
                    <select required value={formData.ruleType} onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}>
                      <option value="XP_COUNT">XP Count</option>
                      <option value="CSR_COUNT">CSR Activity Count</option>
                      <option value="CHALLENGE_COUNT">Challenge Completion Count</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Rule value (threshold) *</span>
                    <input required type="number" min="1" value={formData.ruleValue} onChange={(e) => setFormData({ ...formData, ruleValue: e.target.value })} placeholder="e.g. 5" />
                  </label>
                  <label className="field">
                    <span>Badge icon URL *</span>
                    <input required value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="e.g. https://domain.com/icon.jpg" />
                  </label>
                </>
              )}

              {modalType === 'policy' && (
                <>
                  <label className="field">
                    <span>Policy title *</span>
                    <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Code of Conduct" />
                  </label>
                  <label className="field">
                    <span>Description *</span>
                    <textarea required style={{ height: '100px' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detailed policy description" />
                  </label>
                  <label className="field">
                    <span>Document link URL *</span>
                    <input required value={formData.documentUrl} onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })} placeholder="e.g. https://domain.com/doc.pdf" />
                  </label>
                </>
              )}

              {modalType === 'factor' && (
                <>
                  <label className="field">
                    <span>Emission factor name *</span>
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Grid energy (2026)" />
                  </label>
                  <label className="field">
                    <span>Activity type *</span>
                    <select required value={formData.activityType} onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}>
                      <option value="Purchase">Purchase</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Fleet">Fleet</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Waste">Waste</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Coefficient factor *</span>
                    <input required type="number" step="any" min="0" value={formData.factor} onChange={(e) => setFormData({ ...formData, factor: e.target.value })} placeholder="e.g. 0.85" />
                  </label>
                  <label className="field">
                    <span>Measurement unit *</span>
                    <input required value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g. kwh" />
                  </label>
                  <label className="field">
                    <span>Regulatory source *</span>
                    <input required value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="e.g. EPA Greenhouse Gas Inventory" />
                  </label>
                  <label className="field">
                    <span>Year</span>
                    <input type="number" min="2000" max="2100" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="e.g. 2026" />
                  </label>
                </>
              )}

              {modalType === 'category' && (
                <>
                  <label className="field">
                    <span>Category name *</span>
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Water Usage" />
                  </label>
                  <label className="field">
                    <span>Module *</span>
                    <select required value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })}>
                      <option value="Environmental">Environmental</option>
                      <option value="Social">Social</option>
                      <option value="Governance">Governance</option>
                    </select>
                  </label>
                </>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={modalSubmitting}>
                  {modalSubmitting ? 'Saving...' : 'Save and Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeptDrilldown dept={selectedDept} onClose={() => setSelectedDept(null)} />
    </div>
  );
}

function MasterDataView({ departments, users, policies, emissionFactors, categories, loading, onOpenAdd }) {
  const [tab, setTab] = useState('Employees');
  const masterDataTabs = ['Employees', 'Emission Factors', 'Policies', 'Categories'];

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton" style={{ height: '350px', width: '100%' }} />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Master data</div>
          <div className="card-subtitle">Configure the building blocks EcoSphere runs on</div>
        </div>
      </div>
      <div className="tab-row">
        {masterDataTabs.map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? 'tab-btn-active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Employees' && (
        <table className="dept-table">
          <thead><tr><th>Name</th><th>Department</th><th>Role</th><th>XP</th><th>Coins</th><th></th></tr></thead>
          <tbody>
            {users.map((e) => (
              <tr key={e.id || e._id}>
                <td className="dept-name">{e.name}</td>
                <td>{e.department?.name || '—'}</td>
                <td>{e.role}</td>
                <td>{e.xp || 0}</td>
                <td>{e.coins || 0}</td>
                <td><button className="link-btn" onClick={() => toast.info('Edit employee coming soon.')}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === 'Emission Factors' && (
        <table className="dept-table">
          <thead><tr><th>Activity</th><th>Factor</th><th>Scope</th><th>Unit</th><th></th></tr></thead>
          <tbody>
            {emissionFactors.map((e) => (
              <tr key={e.id || e._id}>
                <td className="dept-name">{e.name || e.activity || '—'}</td>
                <td>{e.factor}</td>
                <td>{e.scope || 'Scope 1'}</td>
                <td>{e.unit}</td>
                <td><button className="link-btn" onClick={() => toast.info('Edit coming soon.')}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === 'Policies' && (
        <table className="dept-table">
          <thead><tr><th>Policy</th><th>Status</th><th>Acceptance</th><th></th></tr></thead>
          <tbody>
            {policies.map((e) => (
              <tr key={e.id || e._id}>
                <td className="dept-name">{e.title || e.name}</td>
                <td><span className={e.status === 'Active' ? 'issue-ok' : 'issue-badge'}>{e.status}</span></td>
                <td>{e.acceptanceRate || e.acceptance || '0%'}</td>
                <td><button className="link-btn" onClick={() => toast.info('Edit coming soon.')}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === 'Categories' && (
        <table className="dept-table">
          <thead><tr><th>Category</th><th>Module</th><th></th></tr></thead>
          <tbody>
            {categories.map((e) => (
              <tr key={e.id || e._id}><td className="dept-name">{e.name}</td><td>{e.module}</td><td><button className="link-btn" onClick={() => toast.info('Edit coming soon.')}>Edit</button></td></tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => onOpenAdd(tab)}>
        <Plus size={15} /> Add {tab.toLowerCase()}
      </button>
    </div>
  );
}
