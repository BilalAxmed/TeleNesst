import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { ProjectRecord, DailyWork, SummaryKPI } from '../../types';
import { formatCurrency } from '../../services/currency';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { AutoSaveWidget } from '../common/AutoSaveWidget';
import { autoSaveService } from '../../services/autoSaveService';
import { DailyActivitiesSheet } from './DailyActivitiesSheet';
import { ExportService, ReportMeta } from '../../services/exportService';
import {
  Briefcase,
  Clock,
  CheckCircle,
  CalendarDays,
  Plus,
  Search,
  Filter,
  Users,
  AlertCircle,
  Building,
  DollarSign,
  TrendingUp,
  MapPin,
  CloudSun,
  Edit2,
  Trash2,
  X,
  Printer,
  Download,
  ChevronRight,
  ExternalLink,
  Award,
  FileText,
  Tag,
  Save,
} from 'lucide-react';

export const ProjectsModule: React.FC = () => {
  const {
    subTab,
    setSubTab,
    currentUser,
    homeCurrency,
    companyConfig,
    openLetterheadModal,
    showToast,
    canAccessFeature,
    triggerDataRefresh,
    softwareName,
  } = useApp();

  const [activeProjectView, setActiveProjectView] = useState<'ongoing' | 'completed' | 'daily-works'>(() => {
    if (subTab === 'completed') return 'completed';
    if (subTab === 'daily-works') return 'daily-works';
    return 'ongoing';
  });

  const [projects, setProjects] = useState<ProjectRecord[]>(() => storage.getProjects());
  const [dailyWorks, setDailyWorks] = useState<DailyWork[]>(() => storage.getDailyWorks());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [isDailyWorkModalOpen, setIsDailyWorkModalOpen] = useState(false);
  const [editingDailyWork, setEditingDailyWork] = useState<DailyWork | null>(null);
  const [dailyWorkToDelete, setDailyWorkToDelete] = useState<DailyWork | null>(null);
  const [isDeletingDailyWork, setIsDeletingDailyWork] = useState(false);

  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ProjectRecord | null>(null);

  React.useEffect(() => {
    if (subTab === 'ongoing' || subTab === 'completed' || subTab === 'daily-works') {
      setActiveProjectView(subTab);
    }
  }, [subTab]);

  const switchView = (v: 'ongoing' | 'completed' | 'daily-works') => {
    setActiveProjectView(v);
    setSubTab(v);
  };

  const reloadData = () => {
    setProjects(storage.getProjects());
    setDailyWorks(storage.getDailyWorks());
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const isCompletedTab = activeProjectView === 'completed';
      if (isCompletedTab && p.status !== 'Completed') return false;
      if (!isCompletedTab && activeProjectView === 'ongoing' && p.status === 'Completed') return false;

      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectManager.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchClient = clientFilter === 'ALL' || p.client === clientFilter;

      return matchSearch && matchStatus && matchClient;
    });
  }, [projects, activeProjectView, searchQuery, statusFilter, clientFilter]);

  // Filtered daily works
  const filteredDailyWorks = useMemo(() => {
    return dailyWorks.filter((d) => {
      const matchSearch =
        d.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.teamLead.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.tasksCompleted.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.issuesEncountered.toLowerCase().includes(searchQuery.toLowerCase());

      let matchDate = true;
      if (dateFrom) matchDate = matchDate && d.date >= dateFrom;
      if (dateTo) matchDate = matchDate && d.date <= dateTo;

      return matchSearch && matchDate;
    });
  }, [dailyWorks, searchQuery, dateFrom, dateTo]);

  // Handle Save Project
  const handleSaveProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const title = fd.get('title') as string;
    const code = (fd.get('code') as string) || `PRJ-${Date.now().toString().slice(-4)}`;
    const client = fd.get('client') as string;
    const category = (fd.get('category') as any) || 'FTTH';
    const startDate = fd.get('startDate') as string;
    const targetEndDate = fd.get('targetEndDate') as string;
    const progressPercent = Number(fd.get('progressPercent')) || 0;
    const projectManager = fd.get('projectManager') as string;
    const assignedTeam = (fd.get('assignedTeam') as string) || 'Engineering Unit Alpha';
    const budget = Number(fd.get('budget')) || 0;
    const status = (fd.get('status') as any) || 'In Progress';
    const notes = (fd.get('notes') as string) || '';

    const projData: ProjectRecord = {
      id: editingProject ? editingProject.id : `prj_${Date.now()}`,
      code,
      title,
      client,
      category,
      startDate,
      targetEndDate,
      completionDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
      assignedTeam,
      projectManager,
      progressPercent: status === 'Completed' ? 100 : progressPercent,
      budget,
      currency: homeCurrency,
      status,
      notes,
      tags: [category, status],
      finalReportSummary: editingProject?.finalReportSummary,
      createdByUserId: editingProject ? (editingProject.createdByUserId || currentUser?.id) : currentUser?.id,
      createdByUserName: editingProject ? (editingProject.createdByUserName || currentUser?.fullName) : currentUser?.fullName,
      lastUpdatedByUserId: currentUser?.id,
      lastUpdatedByUserName: currentUser?.fullName,
    };

    const updated = editingProject
      ? projects.map((p) => (p.id === editingProject.id ? projData : p))
      : [projData, ...projects];

    storage.saveProjects(updated);
    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: editingProject ? 'UPDATE' : 'CREATE',
      module: 'Projects',
      targetId: projData.id,
      description: `${editingProject ? 'Updated' : 'Created'} project: ${projData.title} (${projData.client})`,
    });

    showToast(`Project "${title}" saved successfully.`, 'success');
    setIsProjectModalOpen(false);
    setEditingProject(null);
    reloadData();
  };

  // Mark Project as Completed
  const handleMarkCompleted = (proj: ProjectRecord) => {
    const updated = projects.map((p) =>
      p.id === proj.id
        ? {
            ...p,
            status: 'Completed' as const,
            progressPercent: 100,
            completionDate: new Date().toISOString().split('T')[0],
            finalReportSummary: 'Successfully completed on-site engineering milestones and verified loop attenuation.',
            lastUpdatedByUserId: currentUser?.id,
            lastUpdatedByUserName: currentUser?.fullName,
          }
        : p
    );
    storage.saveProjects(updated);
    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: 'UPDATE',
      module: 'Projects',
      targetId: proj.id,
      description: `Project marked completed: ${proj.title}`,
    });
    showToast(`Project "${proj.title}" moved to Completed Archives.`, 'success');
    reloadData();
  };

  // Delete Project (Ongoing or Completed)
  const handleDeleteProject = (proj: ProjectRecord) => {
    setProjectToDelete(proj);
  };

  const handleConfirmDeleteProject = () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    try {
      const updated = projects.filter((p) => p.id !== projectToDelete.id);
      storage.saveProjects(updated);
      setProjects(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'DELETE',
        module: 'Projects',
        targetId: projectToDelete.id,
        description: `Deleted project ${projectToDelete.code} - ${projectToDelete.title}`,
      });
      showToast(`Project "${projectToDelete.title}" permanently removed.`, 'warning');
      setProjectToDelete(null);
      reloadData();
      triggerDataRefresh();
    } catch (err: any) {
      showToast(`Failed to delete project: ${err?.message || err}`, 'error');
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Save Daily Work
  const handleSaveDailyWork = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const projectCode = fd.get('projectCode') as string;
    const linkedProj = projects.find((p) => p.code === projectCode);
    const date = fd.get('date') as string;
    const teamLead = fd.get('teamLead') as string;
    const techniciansCount = Number(fd.get('techniciansCount')) || 3;
    const tasksCompleted = fd.get('tasksCompleted') as string;
    const workType = (fd.get('workType') as any) || 'FTTH';
    const metersInstalled = Number(fd.get('metersInstalled')) || 0;
    const issuesEncountered = (fd.get('issuesEncountered') as string) || 'None. Smooth deployment.';
    const weatherCondition = (fd.get('weatherCondition') as string) || 'Clear / 28°C';
    const notes = (fd.get('notes') as string) || '';

    const workData: DailyWork = {
      id: editingDailyWork ? editingDailyWork.id : `dw_${Date.now()}`,
      date,
      projectCode,
      projectName: linkedProj ? linkedProj.title : 'Independent Field Task',
      workType,
      teamLead,
      techniciansCount,
      tasksCompleted,
      metersInstalled,
      issuesEncountered,
      status: 'Submitted',
      weatherCondition,
      safetyIncidentReported: false,
      notes,
    };

    const updated = editingDailyWork
      ? dailyWorks.map((d) => (d.id === editingDailyWork.id ? workData : d))
      : [workData, ...dailyWorks];

    storage.saveDailyWorks(updated);
    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: editingDailyWork ? 'UPDATE' : 'CREATE',
      module: 'DailyWorks',
      targetId: workData.id,
      description: `Logged daily work on ${workData.projectName} by lead ${workData.teamLead}`,
    });

    showToast('Daily work record saved.', 'success');
    setIsDailyWorkModalOpen(false);
    setEditingDailyWork(null);
    reloadData();
  };

  // Delete Daily Work
  const handleDeleteDailyWork = (dw: DailyWork) => {
    setDailyWorkToDelete(dw);
  };

  const handleConfirmDeleteDailyWork = () => {
    if (!dailyWorkToDelete) return;
    setIsDeletingDailyWork(true);
    try {
      const updated = dailyWorks.filter((d) => d.id !== dailyWorkToDelete.id);
      storage.saveDailyWorks(updated);
      setDailyWorks(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'DELETE',
        module: 'DailyWorks',
        targetId: dailyWorkToDelete.id,
        description: `Deleted daily work log for ${dailyWorkToDelete.projectName} on ${dailyWorkToDelete.date}`,
      });
      showToast('Daily work log permanently deleted.', 'warning');
      setDailyWorkToDelete(null);
      reloadData();
      triggerDataRefresh();
    } catch (err: any) {
      showToast(`Failed to delete daily work log: ${err?.message || err}`, 'error');
    } finally {
      setIsDeletingDailyWork(false);
    }
  };

  // Export Projects
  const handleExportProjects = () => {
    const isOngoing = activeProjectView === 'ongoing';
    const columns = [
      { header: 'Project Code', key: 'code' },
      { header: 'Project Title', key: 'title' },
      { header: 'Client', key: 'client' },
      { header: 'Category', key: 'category' },
      { header: 'Lead PM', key: 'projectManager' },
      { header: 'Progress', key: 'progressFormatted' },
      { header: 'Start Date', key: 'startDate' },
      { header: isOngoing ? 'Target End' : 'Completion Date', key: isOngoing ? 'targetEndDate' : 'completionDate' },
      { header: 'Budget', key: 'budgetFormatted' },
      { header: 'Status', key: 'status' },
    ];

    const data = filteredProjects.map((p) => ({
      ...p,
      progressFormatted: `${p.progressPercent}%`,
      budgetFormatted: formatCurrency(p.budget, p.currency, { includeCode: true }),
    }));

    const totalBudget = filteredProjects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const avgProgress =
      filteredProjects.length > 0
        ? Math.round(filteredProjects.reduce((acc, p) => acc + (p.progressPercent || 0), 0) / filteredProjects.length)
        : 0;

    const summaryCards: SummaryKPI[] = [
      {
        label: isOngoing ? 'Active Ongoing Projects' : 'Completed Projects',
        value: `${data.length} Projects`,
        subtext: isOngoing ? 'In delivery phase' : 'Archived deliveries',
      },
      {
        label: 'Total Capital Budget',
        value: formatCurrency(totalBudget, homeCurrency, { includeCode: true }),
        subtext: 'Allocated infrastructure funding',
      },
      {
        label: 'Average Milestone Progress',
        value: `${avgProgress}%`,
        subtext: 'Execution velocity',
      },
      {
        label: 'Infrastructure Portfolio',
        value: `${new Set(filteredProjects.map((p) => p.category)).size} Domains`,
        subtext: 'FTTH, FTTB, FTTM, Core',
      },
    ];

    openLetterheadModal({
      title: isOngoing ? 'Ongoing ICT Engineering Projects Status Report' : 'Completed Projects & Delivery Archives',
      columns,
      data,
      dateRange: `As of ${new Date().toLocaleDateString()}`,
      filterSummary: `Total Projects: ${data.length} | Cumulative Budget: ${formatCurrency(totalBudget, homeCurrency, { includeCode: true })}`,
      summaryCards,
      moduleName: 'Projects',
    });
  };

  // Export Daily Works
  const handleExportDailyWorks = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Project Code', key: 'projectCode' },
      { header: 'Project Linked', key: 'projectName' },
      { header: 'Work Type', key: 'workType' },
      { header: 'Team Lead', key: 'teamLead' },
      { header: 'Technicians', key: 'techniciansCount' },
      { header: 'Cable Laid (m)', key: 'metersInstalled' },
      { header: 'Tasks Completed', key: 'tasksCompleted' },
      { header: 'Weather', key: 'weatherCondition' },
      { header: 'Issues Encountered', key: 'issuesEncountered' },
      { header: 'Status', key: 'status' },
    ];

    const totalMeters = filteredDailyWorks.reduce((acc, d) => acc + (d.metersInstalled || 0), 0);
    const totalTechs = filteredDailyWorks.reduce((acc, d) => acc + (d.techniciansCount || 0), 0);
    const completedCount = filteredDailyWorks.filter((d) => d.status === 'Completed' || d.status === 'Verified').length;

    const summaryCards: SummaryKPI[] = [
      {
        label: 'Daily Field Work Orders',
        value: `${filteredDailyWorks.length} Logged`,
        subtext: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'Current field roster',
      },
      {
        label: 'Total Fiber Installed',
        value: `${totalMeters.toLocaleString()} m`,
        subtext: 'Direct field telemetry',
      },
      {
        label: 'Technician Deployments',
        value: `${totalTechs} Person-shifts`,
        subtext: 'Engineering field resources',
      },
      {
        label: 'Verified Compliance',
        value: `${completedCount} / ${filteredDailyWorks.length} Done`,
        subtext: 'Quality sign-offs',
      },
    ];

    openLetterheadModal({
      title: 'Daily Field Activity & Work Progress Dispatch Report',
      columns,
      data: filteredDailyWorks,
      dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : `Generated: ${new Date().toLocaleDateString()}`,
      filterSummary: `Daily logs count: ${filteredDailyWorks.length} | Cable installed: ${totalMeters.toLocaleString()}m`,
      summaryCards,
      moduleName: 'Projects',
    });
  };

  // Download PDF directly with Professional Letterhead Layout & Executive Summaries
  const handleDownloadPDF = () => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];

    if (activeProjectView === 'daily-works') {
      const columns = [
        { header: 'Date', key: 'date' },
        { header: 'Project Code', key: 'projectCode' },
        { header: 'Project Linked', key: 'projectName' },
        { header: 'Work Type', key: 'workType' },
        { header: 'Team Lead', key: 'teamLead' },
        { header: 'Technicians', key: 'techniciansCount' },
        { header: 'Cable Laid (m)', key: 'metersInstalled' },
        { header: 'Tasks Completed', key: 'tasksCompleted' },
        { header: 'Weather', key: 'weatherCondition' },
        { header: 'Issues Encountered', key: 'issuesEncountered' },
        { header: 'Status', key: 'status' },
      ];

      const totalMeters = filteredDailyWorks.reduce((acc, d) => acc + (d.metersInstalled || 0), 0);
      const totalTechs = filteredDailyWorks.reduce((acc, d) => acc + (d.techniciansCount || 0), 0);
      const completedCount = filteredDailyWorks.filter((d) => d.status === 'Completed' || d.status === 'Verified').length;

      const summaryCards: SummaryKPI[] = [
        {
          label: 'Daily Field Work Orders',
          value: `${filteredDailyWorks.length} Logged`,
          subtext: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'Current field roster',
        },
        {
          label: 'Total Fiber Installed',
          value: `${totalMeters.toLocaleString()} m`,
          subtext: 'Direct field telemetry',
        },
        {
          label: 'Technician Deployments',
          value: `${totalTechs} Person-shifts`,
          subtext: 'Engineering field resources',
        },
        {
          label: 'Verified Compliance',
          value: `${completedCount} / ${filteredDailyWorks.length} Done`,
          subtext: 'Quality sign-offs',
        },
      ];

      const meta: ReportMeta = {
        title: 'Daily Field Activity & Work Progress Dispatch Report',
        dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : `Generated: ${new Date().toLocaleDateString()}`,
        filterSummary: `Daily logs count: ${filteredDailyWorks.length} | Cable installed: ${totalMeters.toLocaleString()}m`,
        currentUser,
        companyConfig,
        summaryCards,
        moduleName: 'Projects',
      };

      try {
        ExportService.exportToPDF(
          `${softwareName}_Projects_Daily_Activities_${todayStr}.pdf`,
          columns,
          filteredDailyWorks,
          meta
        );
        showToast('Daily Field Activities PDF downloaded with professional letterhead layout.', 'success');
      } catch (err: any) {
        showToast(`PDF download failed: ${err?.message || err}`, 'error');
      }
    } else {
      const isOngoing = activeProjectView === 'ongoing';
      const columns = [
        { header: 'Project Code', key: 'code' },
        { header: 'Project Title', key: 'title' },
        { header: 'Client', key: 'client' },
        { header: 'Category', key: 'category' },
        { header: 'Lead PM', key: 'projectManager' },
        { header: 'Assigned Team', key: 'assignedTeam' },
        { header: 'Progress', key: 'progressFormatted' },
        { header: 'Start Date', key: 'startDate' },
        { header: isOngoing ? 'Target End' : 'Completion Date', key: isOngoing ? 'targetEndDate' : 'completionDate' },
        { header: 'Budget', key: 'budgetFormatted' },
        { header: 'Status', key: 'status' },
      ];

      const data = filteredProjects.map((p) => ({
        ...p,
        progressFormatted: `${p.progressPercent}%`,
        budgetFormatted: formatCurrency(p.budget, p.currency, { includeCode: true }),
      }));

      const totalBudget = filteredProjects.reduce((acc, p) => acc + (p.budget || 0), 0);
      const avgProgress =
        filteredProjects.length > 0
          ? Math.round(filteredProjects.reduce((acc, p) => acc + (p.progressPercent || 0), 0) / filteredProjects.length)
          : 0;

      const summaryCards: SummaryKPI[] = [
        {
          label: isOngoing ? 'Active Ongoing Projects' : 'Completed Projects',
          value: `${data.length} Projects`,
          subtext: isOngoing ? 'In delivery phase' : 'Archived deliveries',
        },
        {
          label: 'Total Capital Budget',
          value: formatCurrency(totalBudget, homeCurrency, { includeCode: true }),
          subtext: 'Allocated infrastructure funding',
        },
        {
          label: 'Average Milestone Progress',
          value: `${avgProgress}%`,
          subtext: 'Execution velocity',
        },
        {
          label: 'Infrastructure Portfolio',
          value: `${new Set(filteredProjects.map((p) => p.category)).size} Domains`,
          subtext: 'FTTH, FTTB, FTTM, Core',
        },
      ];

      const meta: ReportMeta = {
        title: isOngoing ? 'Ongoing ICT Engineering Projects Status Report' : 'Completed Projects & Delivery Archives',
        dateRange: `As of ${new Date().toLocaleDateString()}`,
        filterSummary: `Total Projects: ${data.length} | Cumulative Value: ${formatCurrency(totalBudget, homeCurrency, { includeCode: true })}`,
        currentUser,
        companyConfig,
        summaryCards,
        moduleName: 'Projects',
      };

      try {
        ExportService.exportToPDF(
          `${softwareName}_${isOngoing ? 'Ongoing' : 'Completed'}_Projects_Summary_${todayStr}.pdf`,
          columns,
          data,
          meta
        );
        showToast(`${isOngoing ? 'Ongoing' : 'Completed'} Projects PDF downloaded with professional letterhead layout.`, 'success');
      } catch (err: any) {
        showToast(`PDF download failed: ${err?.message || err}`, 'error');
      }
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]">
              Projects & Operations Center
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Module 4
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Turnkey infrastructure lifecycle, milestone deadlines, and daily technician field logs
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub Views */}
          <div className="flex rounded-lg bg-[var(--bg-card)] p-1 border border-[var(--border-main)] text-xs font-bold">
            <button
              onClick={() => switchView('ongoing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeProjectView === 'ongoing'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Ongoing</span>
            </button>
            <button
              onClick={() => switchView('completed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeProjectView === 'completed'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Completed</span>
            </button>
            <button
              onClick={() => switchView('daily-works')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeProjectView === 'daily-works'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Daily Activities</span>
            </button>
          </div>

          {activeProjectView !== 'daily-works' ? (
            <button
              onClick={() => {
                setEditingProject(null);
                setIsProjectModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingDailyWork(null);
                setIsDailyWorkModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Daily Work</span>
            </button>
          )}

          {activeProjectView === 'daily-works' && (
            <button
              onClick={async () => {
                const res = await autoSaveService.triggerSave(true, 'Manual Daily Work Save');
                if (res.success) {
                  showToast(
                    `Daily works saved manually to ${res.destination} at ${res.timestamp}! (${res.dailyWorksCount} works preserved)`,
                    'success'
                  );
                } else {
                  showToast(res.message, 'error');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Save daily update work immediately to Portable Folder & Cloud"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save to Portable/Cloud</span>
            </button>
          )}

          {/* Direct Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            title="Download official PDF report summary with professional letterhead layout"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={activeProjectView === 'daily-works' ? handleExportDailyWorks : handleExportProjects}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
            title="Preview report with corporate letterhead in modal"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Letterhead Preview</span>
          </button>
        </div>
      </div>

      {/* 1-Minute Auto-Save Engine for Daily Works */}
      {activeProjectView === 'daily-works' && (
        <AutoSaveWidget variant="card" />
      )}

      {activeProjectView !== 'daily-works' && (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Active Client Projects</div>
              <div className="text-xl font-extrabold text-[var(--text-main)] mt-1">
                {projects.filter((p) => p.status !== 'Completed').length} Ongoing
              </div>
              <div className="text-[10px] text-blue-400 font-semibold mt-0.5">
                {projects.filter((p) => p.status === 'Completed').length} delivered in archive
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Total Fiber Laid in Field Logs</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {dailyWorks.reduce((acc, d) => acc + d.metersInstalled, 0).toLocaleString()} m
              </div>
              <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
                {dailyWorks.length} official work orders logged
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Cumulative Project Portfolio</div>
              <div className="text-xl font-extrabold text-indigo-400 mt-1">
                {formatCurrency(
                  projects.reduce((acc, p) => acc + p.budget, 0),
                  homeCurrency,
                  { includeCode: true }
                )}
              </div>
              <div className="text-[10px] text-indigo-400 font-semibold mt-0.5">
                Capital expenditure allocated
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search project title, code, client, PM..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Testing">Testing</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      {activeProjectView !== 'daily-works' ? (
        /* Projects Grid / Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.length === 0 ? (
            <div className="col-span-2 p-12 text-center text-xs text-[var(--text-dim)] border border-[var(--border-main)] rounded-xl bg-[var(--bg-card)]">
              No projects found matching the selected parameters.
            </div>
          ) : (
            filteredProjects.map((p) => {
              return (
                <div
                  key={p.id}
                  className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] shadow-xs transition flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-input)] text-blue-400 border border-[var(--border-light)]">
                            {p.code}
                          </span>
                          <h3 className="font-bold text-sm text-[var(--text-main)]">{p.title}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'Completed'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : p.status === 'In Progress'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : p.status === 'Testing'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] font-medium mt-1">
                          Client: <span className="text-[var(--text-main)] font-semibold">{p.client}</span> &bull; Lead:{' '}
                          <span className="text-[var(--text-dim)]">{p.projectManager}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProject(p);
                            setIsProjectModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)] cursor-pointer transition"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canAccessFeature('canDeleteProjects') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p)}
                            className="p-1.5 rounded-lg hover:bg-rose-950/40 text-[var(--text-dim)] hover:text-rose-400 cursor-pointer transition"
                            title={`Delete ${activeProjectView === 'completed' ? 'Completed Archive' : 'Ongoing Project'}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[var(--text-dim)] mt-3 line-clamp-2 leading-relaxed">
                      {p.notes || p.finalReportSummary || 'Turnkey telecom and infrastructure project.'}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[var(--text-muted)]">Progress</span>
                        <span className="font-mono font-bold text-blue-400">{p.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--bg-input)] overflow-hidden border border-[var(--border-main)]">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${p.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial & Dates */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--border-main)] text-xs">
                      <div>
                        <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">Budget Allocated</div>
                        <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                          {formatCurrency(p.budget, p.currency, { includeCode: true })}
                        </div>
                        <div className="text-[10px] text-[var(--text-dim)] mt-0.5 font-medium">
                          Team: {p.assignedTeam}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                          {p.status === 'Completed' ? 'Delivered On' : 'Target Deadline'}
                        </div>
                        <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                          {p.status === 'Completed' ? p.completionDate : p.targetEndDate}
                        </div>
                        <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Started: {p.startDate}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-[var(--border-main)] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedProjectDetail(p)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <span>View Specifications</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {p.status !== 'Completed' && (
                      <button
                        onClick={() => handleMarkCompleted(p)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Mark as Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Excel-Style Daily Field Activities Sheet */
        <DailyActivitiesSheet
          projects={projects}
          onDataChanged={reloadData}
        />
      )}

      {/* Project Detail Drawer / Modal */}
      {selectedProjectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-mono text-[10px] text-blue-400 font-bold">{selectedProjectDetail.code}</div>
                  <h3 className="text-base font-bold">{selectedProjectDetail.title}</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Client: {selectedProjectDetail.client} &bull; Lead PM: {selectedProjectDetail.projectManager}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProjectDetail(null)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">
                  Project Scope & Technical Description
                </label>
                <p className="mt-1 text-[var(--text-main)] leading-relaxed bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-main)]">
                  {selectedProjectDetail.notes || selectedProjectDetail.finalReportSummary || 'Turnkey fiber optic cabling & engineering deployment.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)]">
                  <div className="text-[10px] text-[var(--text-dim)]">Financial Target</div>
                  <div className="text-sm font-bold font-mono mt-0.5 text-blue-400">
                    {formatCurrency(selectedProjectDetail.budget, selectedProjectDetail.currency, { includeCode: true })}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">
                    Team: {selectedProjectDetail.assignedTeam}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)]">
                  <div className="text-[10px] text-[var(--text-dim)]">Delivery Schedule</div>
                  <div className="text-xs font-semibold mt-0.5">
                    Start: {selectedProjectDetail.startDate}
                  </div>
                  <div className="text-xs font-semibold mt-0.5 text-amber-400">
                    Target: {selectedProjectDetail.targetEndDate}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">
                  Linked Daily Field Logs
                </label>
                <div className="mt-1.5 space-y-1.5 max-h-40 overflow-y-auto">
                  {dailyWorks
                    .filter((d) => d.projectCode === selectedProjectDetail.code)
                    .map((dw) => (
                      <div
                        key={dw.id}
                        className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <div className="font-semibold">{dw.tasksCompleted}</div>
                          <div className="text-[10px] text-[var(--text-dim)]">
                            {dw.date} &bull; Lead: {dw.teamLead}
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold text-emerald-400">
                          {dw.metersInstalled} m laid
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Action Buttons in Project Details */}
              <div className="pt-3 border-t border-[var(--border-main)] flex items-center justify-between">
                {canAccessFeature('canDeleteProjects') && (
                  <button
                    type="button"
                    onClick={() => {
                      const proj = selectedProjectDetail;
                      setSelectedProjectDetail(null);
                      handleDeleteProject(proj);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Project</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const proj = selectedProjectDetail;
                      setSelectedProjectDetail(null);
                      setEditingProject(proj);
                      setIsProjectModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Project</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProjectDetail(null)}
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingProject ? 'Edit Project Specifications' : 'Initialize New Infrastructure Project'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Define client milestones, project manager, and financial allocation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="mt-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    defaultValue={editingProject?.code || `PRJ-${Date.now().toString().slice(-4)}`}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingProject?.title || ''}
                    placeholder="e.g. Islamabad Metro Optical Ring Extension"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Client / Telecom Authority
                  </label>
                  <input
                    type="text"
                    name="client"
                    required
                    defaultValue={editingProject?.client || 'PTCL / Nayatel'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingProject?.category || 'FTTH'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  >
                    <option value="FTTH">FTTH (Home Fiber)</option>
                    <option value="FTTB">FTTB (Building Fiber)</option>
                    <option value="FTTM">FTTM (Metro & 5G Towers)</option>
                    <option value="Warehouse Infrastructure">Warehouse Infrastructure</option>
                    <option value="Core Transport">Core Transport</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={editingProject?.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Target End Date
                  </label>
                  <input
                    type="date"
                    name="targetEndDate"
                    defaultValue={editingProject?.targetEndDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingProject?.status || 'In Progress'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Testing">Testing</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Lead PM
                  </label>
                  <input
                    type="text"
                    name="projectManager"
                    defaultValue={editingProject?.projectManager || currentUser?.fullName || 'Bilal Ahmed'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    name="progressPercent"
                    defaultValue={editingProject?.progressPercent || 35}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Budget ({homeCurrency})
                  </label>
                  <input
                    type="number"
                    name="budget"
                    defaultValue={editingProject?.budget || 45000}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Scope & Deliverables Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingProject?.notes || ''}
                  placeholder="e.g. Turnkey deployment of 96-core dark fiber backhaul ring connecting 14 cellular towers..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>

              <div className="pt-3 flex items-center justify-between gap-2 border-t border-[var(--border-main)]">
                {editingProject && canAccessFeature('canDeleteProjects') ? (
                  <button
                    type="button"
                    onClick={() => {
                      const proj = editingProject;
                      setIsProjectModalOpen(false);
                      setEditingProject(null);
                      handleDeleteProject(proj);
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Project</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs transition shadow cursor-pointer"
                  >
                    Save Project
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Daily Work Modal */}
      {isDailyWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingDailyWork ? 'Edit Daily Work Log' : 'Log Daily Field Activity'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Capture cable laying, splicing numbers, technicians on site, and roadblocks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDailyWorkModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDailyWork} className="mt-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Linked Project
                  </label>
                  <select
                    name="projectCode"
                    defaultValue={editingDailyWork?.projectCode || projects[0]?.code}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.code}>
                        {p.code} - {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Activity Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingDailyWork?.date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Work Type
                  </label>
                  <select
                    name="workType"
                    defaultValue={editingDailyWork?.workType || 'FTTH'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  >
                    <option value="FTTH">FTTH</option>
                    <option value="FTTB">FTTB</option>
                    <option value="FTTM">FTTM</option>
                    <option value="Warehouse Logistics">Warehouse Logistics</option>
                    <option value="Emergency Splicing">Emergency Splicing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Crew / Team Lead
                  </label>
                  <input
                    type="text"
                    name="teamLead"
                    defaultValue={editingDailyWork?.teamLead || currentUser?.fullName || 'Usman Ghani'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Techs on Site
                  </label>
                  <input
                    type="number"
                    name="techniciansCount"
                    defaultValue={editingDailyWork?.techniciansCount || 4}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Cable Laid (meters)
                  </label>
                  <input
                    type="number"
                    name="metersInstalled"
                    defaultValue={editingDailyWork?.metersInstalled || 650}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Weather Condition
                  </label>
                  <input
                    type="text"
                    name="weatherCondition"
                    defaultValue={editingDailyWork?.weatherCondition || 'Clear / 26°C'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Tasks Completed Description
                </label>
                <textarea
                  name="tasksCompleted"
                  rows={2}
                  required
                  defaultValue={editingDailyWork?.tasksCompleted || ''}
                  placeholder="e.g. Pulled 96C fiber through duct line B, completed chamber splice at Manhole 14"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Roadblocks or Issues Encountered
                </label>
                <input
                  type="text"
                  name="issuesEncountered"
                  defaultValue={editingDailyWork?.issuesEncountered || 'None. Civil trench clear.'}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDailyWorkModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow"
                >
                  Log Daily Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Project Deletion (Ongoing and Completed) */}
      <ConfirmDeleteModal
        isOpen={!!projectToDelete}
        title={`Delete ${projectToDelete?.status === 'Completed' ? 'Completed Archive' : 'Ongoing Project'}`}
        itemName={projectToDelete ? `${projectToDelete.code} - ${projectToDelete.title}` : ''}
        entityName={projectToDelete ? `${projectToDelete.code} - ${projectToDelete.title}` : ''}
        itemType="project record"
        entityType="Telecom Project"
        warningMessage="This project will be permanently erased from active tracking and completed records. Historical daily work logs linked to this project code will still be preserved."
        description="This project will be permanently erased from active tracking and completed records. Historical daily work logs linked to this project code will still be preserved."
        onConfirm={handleConfirmDeleteProject}
        onClose={() => setProjectToDelete(null)}
        onCancel={() => setProjectToDelete(null)}
        isDeleting={isDeletingProject}
        isLoading={isDeletingProject}
      />

      {/* Confirmation Modal for Daily Work Log Deletion */}
      <ConfirmDeleteModal
        isOpen={!!dailyWorkToDelete}
        title="Delete Daily Field Work Log"
        itemName={dailyWorkToDelete ? `${dailyWorkToDelete.projectName} (${dailyWorkToDelete.date})` : ''}
        entityName={dailyWorkToDelete ? `${dailyWorkToDelete.projectName} (${dailyWorkToDelete.date})` : ''}
        itemType="daily work log"
        entityType="Daily Field Log"
        warningMessage="This field log, technician headcounts, and meterage installation records will be permanently removed from the operations database."
        description="This field log, technician headcounts, and meterage installation records will be permanently removed from the operations database."
        onConfirm={handleConfirmDeleteDailyWork}
        onClose={() => setDailyWorkToDelete(null)}
        onCancel={() => setDailyWorkToDelete(null)}
        isDeleting={isDeletingDailyWork}
        isLoading={isDeletingDailyWork}
      />
    </div>
  );
};
