import React, { useState, useMemo, useRef } from 'react';
import { DailyWork, DailyWorkPhoto, ProjectRecord, SummaryKPI } from '../../types';
import { storage } from '../../services/storage';
import { useApp } from '../../context/AppContext';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { ExportService, ReportMeta } from '../../services/exportService';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Camera,
  Download,
  Trash2,
  Edit2,
  Eye,
  X,
  Upload,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Printer,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface DailyActivitiesSheetProps {
  projects: ProjectRecord[];
  onDataChanged: () => void;
}

export const DailyActivitiesSheet: React.FC<DailyActivitiesSheetProps> = ({
  projects,
  onDataChanged,
}) => {
  const { currentUser, companyConfig, showToast, canAccessFeature, openLetterheadModal, softwareName } = useApp();

  const [dailyWorks, setDailyWorks] = useState<DailyWork[]>(() => storage.getDailyWorks());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Completed' | 'Submitted' | 'Draft'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ row: number; colName: string; value: string } | null>({
    row: 1,
    colName: 'Site ID',
    value: dailyWorks[0]?.siteId || 'SITE-FTTH-G11-C4',
  });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<DailyWork | null>(null);
  const [modalPhotos, setModalPhotos] = useState<DailyWorkPhoto[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  // Photo viewer modal
  const [viewingPhoto, setViewingPhoto] = useState<{
    photo: DailyWorkPhoto;
    work: DailyWork;
  } | null>(null);

  // Site Work Certificate modal
  const [inspectedSite, setInspectedSite] = useState<DailyWork | null>(null);

  // Deletion state for Daily Field Activities & Excel Site Work Sheet
  const [workToDelete, setWorkToDelete] = useState<DailyWork | null>(null);
  const [isDeletingWork, setIsDeletingWork] = useState(false);

  const isAuthorizedToDelete = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'Developer/CEO' || currentUser.role === 'Admin') return true;
    return Boolean(canAccessFeature('canDeleteDailyWorks') || canAccessFeature('canDeleteProjects'));
  }, [currentUser, canAccessFeature]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelImportRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    const fresh = storage.getDailyWorks();
    setDailyWorks(fresh);
    onDataChanged();
  };

  // Filtered rows
  const filteredWorks = useMemo(() => {
    return dailyWorks.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (d.siteId && d.siteId.toLowerCase().includes(q)) ||
        (d.siteName && d.siteName.toLowerCase().includes(q)) ||
        d.projectName.toLowerCase().includes(q) ||
        d.projectCode.toLowerCase().includes(q) ||
        d.teamLead.toLowerCase().includes(q) ||
        d.tasksCompleted.toLowerCase().includes(q) ||
        (d.completionDateTime && d.completionDateTime.toLowerCase().includes(q)) ||
        (d.photos && d.photos.some((p) => p.caption?.toLowerCase().includes(q)));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Completed' && (d.status === 'Completed' || d.isRowChecked)) ||
        (statusFilter !== 'Completed' && d.status === statusFilter);

      let matchDate = true;
      if (dateFrom) matchDate = matchDate && d.date >= dateFrom;
      if (dateTo) matchDate = matchDate && d.date <= dateTo;

      return matchSearch && matchStatus && matchDate;
    });
  }, [dailyWorks, searchQuery, statusFilter, dateFrom, dateTo]);

  // Statistics
  const totalMeters = useMemo(() => {
    return filteredWorks.reduce((sum, w) => sum + (w.metersInstalled || 0), 0);
  }, [filteredWorks]);

  const totalPhotosCount = useMemo(() => {
    return filteredWorks.reduce((sum, w) => sum + (w.photos?.length || 0), 0);
  }, [filteredWorks]);

  const completedCount = useMemo(() => {
    return filteredWorks.filter((w) => w.status === 'Completed' || w.isRowChecked).length;
  }, [filteredWorks]);

  // Toggle Row Done
  const handleToggleRowDone = (dw: DailyWork) => {
    const isNowDone = !(dw.isRowChecked || dw.status === 'Completed');
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updated = dailyWorks.map((item) => {
      if (item.id === dw.id) {
        return {
          ...item,
          isRowChecked: isNowDone,
          status: (isNowDone ? 'Completed' : 'Submitted') as DailyWork['status'],
          completionDateTime: isNowDone
            ? item.completionDateTime || nowStamp
            : item.completionDateTime,
        };
      }
      return item;
    });

    storage.saveDailyWorks(updated);
    setDailyWorks(updated);
    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: 'UPDATE',
      module: 'DailyWorks',
      targetId: dw.id,
      description: `Toggled site activity status for ${dw.siteId || dw.projectName} to ${isNowDone ? 'Completed' : 'Submitted'}`,
    });
    showToast(
      `Site work ${dw.siteId || ''} marked as ${isNowDone ? 'Completed with timestamp ✓' : 'Pending'}.`,
      'success'
    );
    onDataChanged();
  };

  // Open modal for Create/Edit
  const handleOpenModal = (work?: DailyWork) => {
    if (work) {
      setEditingWork(work);
      setModalPhotos(work.photos ? [...work.photos] : []);
    } else {
      setEditingWork(null);
      setModalPhotos([]);
    }
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setIsModalOpen(true);
  };

  // Upload Photo from PC
  const handlePhotoUploadFromPC = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const newPhoto: DailyWorkPhoto = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          url: base64Url,
          caption: newPhotoCaption.trim() || `Site work evidence: ${file.name}`,
          uploadedAt: nowStamp,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        };
        setModalPhotos((prev) => [...prev, newPhoto]);
        setNewPhotoCaption('');
        showToast(`Photo "${file.name}" uploaded successfully.`, 'success');
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add Photo via URL
  const handleAddPhotoByUrl = () => {
    if (!newPhotoUrl.trim()) {
      showToast('Please enter a valid image URL.', 'error');
      return;
    }
    const nowStamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newPhoto: DailyWorkPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: 'Web Image',
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'Site work photo',
      uploadedAt: nowStamp,
      fileSize: 'Web Link',
    };
    setModalPhotos((prev) => [...prev, newPhoto]);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    showToast('Photo URL added.', 'success');
  };

  // Remove Photo from modal list
  const handleRemovePhoto = (photoId: string) => {
    setModalPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Save Daily Work
  const handleSaveDailyWorkForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const siteId = (fd.get('siteId') as string) || `SITE-${Date.now().toString().slice(-4)}`;
    const siteName = (fd.get('siteName') as string) || 'Primary Fiber Terminal';
    const projectCode = fd.get('projectCode') as string;
    const linkedProj = projects.find((p) => p.code === projectCode);
    const date = (fd.get('date') as string) || new Date().toISOString().split('T')[0];
    const completionDateTime = (fd.get('completionDateTime') as string) || (editingWork?.completionDateTime || `${date} 17:00:00`);
    const workType = (fd.get('workType') as any) || 'FTTH';
    const teamLead = (fd.get('teamLead') as string) || currentUser?.fullName || 'Usman Ghani';
    const techniciansCount = Number(fd.get('techniciansCount')) || 4;
    const metersInstalled = Number(fd.get('metersInstalled')) || 0;
    const weatherCondition = (fd.get('weatherCondition') as string) || 'Clear / 28°C';
    const tasksCompleted = (fd.get('tasksCompleted') as string) || '';
    const issuesEncountered = (fd.get('issuesEncountered') as string) || 'None. Smooth execution.';
    const status = (fd.get('status') as any) || 'Completed';
    const notes = (fd.get('notes') as string) || '';

    const newRecord: DailyWork = {
      id: editingWork ? editingWork.id : `dw_${Date.now()}`,
      rowNumber: editingWork?.rowNumber || dailyWorks.length + 1,
      isRowChecked: status === 'Completed',
      siteId,
      siteName,
      date,
      completionDateTime: status === 'Completed' ? completionDateTime : undefined,
      projectCode,
      projectName: linkedProj ? linkedProj.title : 'Independent Telecom Project',
      workType,
      teamLead,
      techniciansCount,
      metersInstalled,
      tasksCompleted,
      issuesEncountered,
      status,
      weatherCondition,
      safetyIncidentReported: false,
      photos: modalPhotos,
      notes,
      createdByUserId: editingWork ? (editingWork.createdByUserId || currentUser?.id) : currentUser?.id,
      createdByUserName: editingWork ? (editingWork.createdByUserName || currentUser?.fullName) : currentUser?.fullName,
      lastUpdatedByUserId: currentUser?.id,
      lastUpdatedByUserName: currentUser?.fullName,
    };

    const updated = editingWork
      ? dailyWorks.map((item) => (item.id === editingWork.id ? newRecord : item))
      : [newRecord, ...dailyWorks];

    storage.saveDailyWorks(updated);
    setDailyWorks(updated);

    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: editingWork ? 'UPDATE' : 'CREATE',
      module: 'DailyWorks',
      targetId: newRecord.id,
      description: `${editingWork ? 'Updated' : 'Created'} site work activity for ${siteId} (${siteName}) with ${modalPhotos.length} photos`,
    });

    showToast(`Daily Site Activity for "${siteId}" successfully saved.`, 'success');
    setIsModalOpen(false);
    setEditingWork(null);
    onDataChanged();
  };

  // Delete Work - Opens In-App Modal (avoids iframe window.confirm blocking)
  const handleDeleteDailyWork = (dw: DailyWork) => {
    setWorkToDelete(dw);
  };

  const handleConfirmDeleteWork = () => {
    if (!workToDelete) return;
    setIsDeletingWork(true);
    try {
      const updated = dailyWorks.filter((item) => item.id !== workToDelete.id);
      storage.saveDailyWorks(updated);
      setDailyWorks(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'DELETE',
        module: 'DailyWorks',
        targetId: workToDelete.id,
        description: `Deleted daily work record ${workToDelete.siteId || workToDelete.projectName}`,
      });
      showToast(`Site work activity "${workToDelete.siteId || workToDelete.projectName}" deleted successfully.`, 'success');
      
      // Close any open modals displaying this item
      if (inspectedSite?.id === workToDelete.id) {
        setInspectedSite(null);
      }
      if (editingWork?.id === workToDelete.id) {
        setIsModalOpen(false);
        setEditingWork(null);
      }
      setWorkToDelete(null);
      onDataChanged();
    } catch (err: any) {
      showToast(`Failed to delete site work activity: ${err?.message || err}`, 'error');
    } finally {
      setIsDeletingWork(false);
    }
  };

  // Export to genuine Excel (.xlsx) using SheetJS
  const handleExportToExcelFile = () => {
    try {
      const dataForExcel = filteredWorks.map((w, idx) => ({
        'Row #': idx + 1,
        'Work Status': w.status === 'Completed' || w.isRowChecked ? 'COMPLETED ✓' : w.status,
        'Site ID': w.siteId || 'N/A',
        'Site Name': w.siteName || 'N/A',
        'Project Code': w.projectCode,
        'Project Name': w.projectName,
        'Work Type': w.workType,
        'Completion Date & Time': w.completionDateTime || w.date,
        'Crew Lead': w.teamLead,
        'Technicians on Site': w.techniciansCount,
        'Cable Laid (Meters)': w.metersInstalled,
        'Tasks Completed': w.tasksCompleted,
        'Weather Condition': w.weatherCondition,
        'Issues / Roadblocks': w.issuesEncountered,
        'Attached Photos Count': w.photos?.length || 0,
        'Photo Captions': w.photos?.map((p) => p.caption || p.name).join(' | ') || 'None',
        'General Notes': w.notes || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

      // Auto column widths
      const colWidths = Object.keys(dataForExcel[0] || {}).map((key) => ({
        wch: Math.max(key.length, 16),
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Site Activities');

      // Export file
      const fileName = `Daily_Site_Activities_Work_Sheet_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      showToast(`Excel Sheet "${fileName}" exported successfully.`, 'success');
    } catch (err: any) {
      showToast(`Excel export error: ${err?.message || err}`, 'error');
    }
  };

  // Import from Excel (.xlsx/.xls/.csv)
  const handleImportExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        showToast('The selected file does not contain any sheets.', 'error');
        return;
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      if (rows.length === 0) {
        showToast('Spreadsheet contains 0 data rows.', 'warning');
        return;
      }

      const importedActivities: DailyWork[] = rows.map((r, idx) => {
        const rowNum = Number(r['Row #'] || r['#'] || r.rowNumber || dailyWorks.length + idx + 1);
        const statusVal = r['Work Status'] || r.Status || r.status || 'Completed';
        const isCompleted = String(statusVal).toLowerCase().includes('complete') || Boolean(r.isRowChecked);
        const dateVal = r.Date || r.date || new Date().toISOString().split('T')[0];
        const completionTime = r['Completion Date & Time'] || r['Completion Date/Time'] || r.completionDateTime || `${dateVal} 17:00:00`;

        return {
          id: r.id || `dw_imp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
          rowNumber: rowNum,
          isRowChecked: isCompleted,
          siteId: r['Site ID'] || r.siteId || `SITE-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
          siteName: r['Site Name'] || r.siteName || 'Field Site Activity',
          date: dateVal,
          completionDateTime: completionTime,
          projectCode: r['Project Code'] || r.projectCode || 'PRJ-FTTH-ISB-G11',
          projectName: r['Project Name'] || r.projectName || 'Capital Smart Fiber City - Sector G-11 Rollout',
          workType: (r['Work Type'] || r.workType || 'FTTH') as any,
          teamLead: r['Crew Lead'] || r['Team Lead'] || r.teamLead || currentUser?.fullName || 'Bilal Ahmed',
          techniciansCount: Number(r['Technicians on Site'] || r['Technicians'] || r.techniciansCount || 4),
          tasksCompleted: r['Tasks Completed'] || r.tasksCompleted || 'Field works executed according to specifications',
          metersInstalled: Number(r['Cable Laid (Meters)'] || r['Meters Installed'] || r.metersInstalled || 0),
          issuesEncountered: r['Issues / Roadblocks'] || r['Issues Encountered'] || r.issuesEncountered || 'None',
          status: isCompleted ? 'Completed' : 'Submitted',
          weatherCondition: r['Weather Condition'] || r.weatherCondition || 'Clear',
          safetyIncidentReported: Boolean(r.safetyIncidentReported || false),
          photos: [],
          notes: r['General Notes'] || r.notes || `Uploaded from spreadsheet ${file.name}`,
        };
      });

      const updated = [...dailyWorks, ...importedActivities];
      storage.saveDailyWorks(updated);
      setDailyWorks(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'BACKUP_IMPORT',
        module: 'DailyWorks',
        targetId: 'excel_upload',
        description: `Uploaded and imported ${importedActivities.length} site activities from Excel spreadsheet (${file.name})`,
      });
      showToast(`Successfully uploaded & imported ${importedActivities.length} activities from ${file.name}!`, 'success');
      onDataChanged();
    } catch (err: any) {
      showToast(`Failed to parse Excel file: ${err?.message || err}`, 'error');
    } finally {
      if (excelImportRef.current) excelImportRef.current.value = '';
    }
  };

  // Print / PDF Dispatch
  const handlePrintDispatch = () => {
    const columns = [
      { header: 'Row #', key: 'rowNumber' },
      { header: 'Status', key: 'status' },
      { header: 'Site ID', key: 'siteId' },
      { header: 'Site Name', key: 'siteName' },
      { header: 'Completion Date/Time', key: 'completionDateTime' },
      { header: 'Type', key: 'workType' },
      { header: 'Team Lead', key: 'teamLead' },
      { header: 'Cable Laid (m)', key: 'metersInstalled' },
      { header: 'Photos', key: 'photosCount' },
      { header: 'Tasks Completed', key: 'tasksCompleted' },
    ];

    const mapped = filteredWorks.map((w, idx) => ({
      ...w,
      rowNumber: idx + 1,
      photosCount: `${w.photos?.length || 0} Photos`,
    }));

    const summaryCards: SummaryKPI[] = [
      {
        label: 'Daily Field Work Orders',
        value: `${mapped.length} Sites`,
        subtext: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'Current field roster',
      },
      {
        label: 'Completed & Certified',
        value: `${completedCount} Sites`,
        subtext: 'Site delivery complete',
      },
      {
        label: 'Total Fiber Laid',
        value: `${totalMeters.toLocaleString()} m`,
        subtext: 'Direct field telemetry',
      },
      {
        label: 'Site Inspection Photos',
        value: `${totalPhotosCount} Evidences`,
        subtext: 'Attached image logs',
      },
    ];

    openLetterheadModal({
      title: 'Daily Site Activities & Completed Field Work Report',
      columns,
      data: mapped,
      dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : `Generated: ${new Date().toLocaleString()}`,
      filterSummary: `Total Sites: ${mapped.length} | Completed Sites: ${completedCount} | Total Cable: ${totalMeters.toLocaleString()}m | Photos: ${totalPhotosCount}`,
      summaryCards,
      moduleName: 'Projects',
    });
  };

  // Download PDF directly with Professional Letterhead Layout & Executive Summaries
  const handleDownloadPDF = () => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const columns = [
      { header: 'Row #', key: 'rowNumber' },
      { header: 'Status', key: 'status' },
      { header: 'Site ID', key: 'siteId' },
      { header: 'Site Name', key: 'siteName' },
      { header: 'Completion Date/Time', key: 'completionDateTime' },
      { header: 'Type', key: 'workType' },
      { header: 'Team Lead', key: 'teamLead' },
      { header: 'Cable Laid (m)', key: 'metersInstalled' },
      { header: 'Photos', key: 'photosCount' },
      { header: 'Tasks Completed', key: 'tasksCompleted' },
    ];

    const mapped = filteredWorks.map((w, idx) => ({
      ...w,
      rowNumber: idx + 1,
      photosCount: `${w.photos?.length || 0} Photos`,
    }));

    const summaryCards: SummaryKPI[] = [
      {
        label: 'Daily Field Work Orders',
        value: `${mapped.length} Sites`,
        subtext: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'Current field roster',
      },
      {
        label: 'Completed & Certified',
        value: `${completedCount} Sites`,
        subtext: 'Site delivery complete',
      },
      {
        label: 'Total Fiber Laid',
        value: `${totalMeters.toLocaleString()} m`,
        subtext: 'Direct field telemetry',
      },
      {
        label: 'Site Inspection Photos',
        value: `${totalPhotosCount} Evidences`,
        subtext: 'Attached image logs',
      },
    ];

    const meta: ReportMeta = {
      title: 'Daily Site Activities & Completed Field Work Report',
      dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : `Generated: ${new Date().toLocaleString()}`,
      filterSummary: `Total Sites: ${mapped.length} | Completed Sites: ${completedCount} | Total Cable: ${totalMeters.toLocaleString()}m | Photos: ${totalPhotosCount}`,
      currentUser,
      companyConfig,
      summaryCards,
      moduleName: 'Projects',
    };

    try {
      ExportService.exportToPDF(
        `${softwareName}_Daily_Site_Activities_Summary_${todayStr}.pdf`,
        columns,
        mapped,
        meta
      );
      showToast('Daily Site Activities PDF downloaded with professional letterhead layout.', 'success');
    } catch (err: any) {
      showToast(`PDF download failed: ${err?.message || err}`, 'error');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* EXCEL RIBBON & ACTIONS TOOLBAR */}
      <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs space-y-3">
        {/* Top bar: Title + Fast Statistics */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h2 className="text-base font-black tracking-tight text-[var(--text-main)] flex items-center gap-2">
                Daily Field Activities & Excel Site Work Sheet
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Microsoft Excel Compatible
                </span>
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Record daily site works with photos, completion timestamps, and full spreadsheet row inspection.
            </p>
          </div>

          {/* KPI Mini-Tiles */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs">
              <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">Logged Sites</div>
              <div className="font-mono font-bold text-blue-400">{filteredWorks.length}</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-emerald-500/30 text-xs">
              <div className="text-[10px] text-emerald-400 uppercase font-semibold">Completed Sites</div>
              <div className="font-mono font-bold text-emerald-400">{completedCount}</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs">
              <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">Cable Laid</div>
              <div className="font-mono font-bold text-[var(--text-main)]">{totalMeters.toLocaleString()} m</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs">
              <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">Work Photos</div>
              <div className="font-mono font-bold text-purple-400 flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span>{totalPhotosCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search Ribbon */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[var(--border-main)]/60 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search completed site work, Site ID, photos, tasks..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] placeholder-[var(--text-dim)] text-xs focus:border-[var(--accent)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[var(--text-dim)] hover:text-[var(--text-main)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs shrink-0"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed Sites Only ✓</option>
              <option value="Submitted">Submitted Field Logs</option>
              <option value="Draft">Drafts</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Download PDF with Letterhead Layout */}
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Download official PDF report summary with professional letterhead layout"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleExportToExcelFile}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Export genuine Microsoft Excel file (.xlsx) with all formulas & photos metadata"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Upload Excel (.xlsx) / CSV file */}
            <input
              ref={excelImportRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcelFile}
              className="hidden"
              id="excel-activities-upload"
            />
            <button
              onClick={() => excelImportRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Upload and import Excel spreadsheet (.xlsx, .xls) or CSV file of site activities"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Excel / CSV</span>
            </button>

            <button
              onClick={handlePrintDispatch}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Preview official letterhead field work report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Letterhead Preview</span>
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Site Activity</span>
            </button>
          </div>
        </div>

        {/* Excel Formula & Cell Coordinate Indicator */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-main)] font-mono text-[11px] text-[var(--text-muted)]">
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
            fx
          </span>
          <span className="text-[var(--text-dim)]">Active Cell:</span>
          <span className="font-bold text-blue-400">
            R{selectedCell?.row}C[{selectedCell?.colName}]
          </span>
          <span className="text-[var(--text-dim)]">=</span>
          <span className="text-[var(--text-main)] truncate max-w-xl">
            {selectedCell?.value}
          </span>
        </div>
      </div>

      {/* INTERACTIVE EXCEL SPREADSHEET GRID */}
      <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-card)] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold select-none">
                <th className="py-2.5 px-3 text-center w-12 border-r border-[var(--border-main)]/50">#</th>
                <th className="py-2.5 px-3 text-center w-28 border-r border-[var(--border-main)]/50">Work Done</th>
                <th className="py-2.5 px-4 border-r border-[var(--border-main)]/50">Site ID & Location</th>
                <th className="py-2.5 px-4 border-r border-[var(--border-main)]/50">Linked Project</th>
                <th className="py-2.5 px-4 border-r border-[var(--border-main)]/50">Completion Date / Time</th>
                <th className="py-2.5 px-3 text-center border-r border-[var(--border-main)]/50">Type</th>
                <th className="py-2.5 px-4 border-r border-[var(--border-main)]/50">Crew Lead</th>
                <th className="py-2.5 px-3 text-center border-r border-[var(--border-main)]/50">Techs</th>
                <th className="py-2.5 px-4 text-right border-r border-[var(--border-main)]/50">Cable Laid</th>
                <th className="py-2.5 px-4 text-center border-r border-[var(--border-main)]/50">Work Photos</th>
                <th className="py-2.5 px-4 border-r border-[var(--border-main)]/50">Work Completed Tasks</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]/60 font-mono text-[11px]">
              {filteredWorks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-[var(--text-dim)] font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-[var(--text-dim)] opacity-40" />
                      <p className="font-semibold text-sm">No site activities match your search query.</p>
                      <p className="text-xs">Try clearing the search query or add a new site field activity.</p>
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white font-bold text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Daily Site Work</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorks.map((w, idx) => {
                  const isDone = w.isRowChecked || w.status === 'Completed';
                  const photosCount = w.photos?.length || 0;

                  return (
                    <tr
                      key={w.id}
                      onClick={() =>
                        setSelectedCell({
                          row: idx + 1,
                          colName: 'Site ID',
                          value: `${w.siteId || 'SITE'} - ${w.siteName || w.projectName}`,
                        })
                      }
                      className={`hover:bg-[var(--bg-hover)] transition group ${
                        isDone ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* Row # */}
                      <td className="py-2.5 px-3 text-center text-[var(--text-dim)] border-r border-[var(--border-main)]/40 font-bold">
                        {idx + 1}
                      </td>

                      {/* Work Done Tick-mark */}
                      <td className="py-2.5 px-3 text-center border-r border-[var(--border-main)]/40">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRowDone(w);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xs'
                              : 'bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-dim)] border-[var(--border-main)]'
                          }`}
                          title={isDone ? 'Site Work Completed! Click to uncheck' : 'Click to mark Site Work Done'}
                        >
                          <CheckSquare className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-400' : 'text-[var(--text-dim)]'}`} />
                          <span>{isDone ? 'Done ✓' : 'Pending'}</span>
                        </button>
                      </td>

                      {/* Site ID & Name */}
                      <td className="py-2.5 px-4 border-r border-[var(--border-main)]/40">
                        <div
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedSite(w);
                          }}
                        >
                          <div className="font-bold text-blue-400 hover:underline flex items-center gap-1">
                            <span>{w.siteId || 'SITE-N/A'}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-blue-400 opacity-60" />
                          </div>
                          <div className="font-sans text-[11px] text-[var(--text-main)] font-medium truncate max-w-xs">
                            {w.siteName || w.projectName}
                          </div>
                        </div>
                      </td>

                      {/* Linked Project */}
                      <td className="py-2.5 px-4 border-r border-[var(--border-main)]/40">
                        <div className="text-[10px] text-[var(--text-dim)]">{w.projectCode}</div>
                        <div className="font-sans text-[11px] text-[var(--text-muted)] truncate max-w-[180px]">
                          {w.projectName}
                        </div>
                      </td>

                      {/* Completion Date & Time */}
                      <td className="py-2.5 px-4 border-r border-[var(--border-main)]/40 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[var(--text-main)] font-semibold">
                          <Calendar className="w-3 h-3 text-blue-400" />
                          <span>{w.date}</span>
                        </div>
                        {w.completionDateTime && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{w.completionDateTime.split(' ')[1] || w.completionDateTime}</span>
                          </div>
                        )}
                      </td>

                      {/* Work Type */}
                      <td className="py-2.5 px-3 text-center border-r border-[var(--border-main)]/40 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--bg-input)] border border-[var(--border-light)] text-[10px] text-[var(--text-dim)] font-sans font-bold">
                          {w.workType}
                        </span>
                      </td>

                      {/* Crew Lead */}
                      <td className="py-2.5 px-4 border-r border-[var(--border-main)]/40 font-sans text-[var(--text-muted)] whitespace-nowrap">
                        {w.teamLead}
                      </td>

                      {/* Technicians */}
                      <td className="py-2.5 px-3 text-center border-r border-[var(--border-main)]/40 font-bold text-slate-300">
                        {w.techniciansCount}
                      </td>

                      {/* Cable Laid */}
                      <td className="py-2.5 px-4 text-right border-r border-[var(--border-main)]/40 font-bold text-emerald-400 whitespace-nowrap">
                        {w.metersInstalled.toLocaleString()} m
                      </td>

                      {/* Work Photos */}
                      <td className="py-2.5 px-4 text-center border-r border-[var(--border-main)]/40">
                        {photosCount > 0 ? (
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Thumbnail preview */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingPhoto({ photo: w.photos![0], work: w });
                              }}
                              className="relative group/photo w-8 h-8 rounded border border-purple-500/40 overflow-hidden hover:scale-110 transition shadow-xs"
                              title="Click to view work photo"
                            >
                              <img
                                src={w.photos![0].url}
                                alt="Site work photo"
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedSite(w);
                              }}
                              className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold hover:bg-purple-500/25 transition flex items-center gap-1"
                              title="Inspect all photos for this site"
                            >
                              <Camera className="w-3 h-3" />
                              <span>{photosCount}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(w);
                            }}
                            className="text-[10px] text-[var(--text-dim)] hover:text-purple-400 font-sans italic hover:underline flex items-center justify-center gap-1"
                          >
                            <Camera className="w-3 h-3 opacity-60" />
                            <span>+ Photo</span>
                          </button>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-4 border-r border-[var(--border-main)]/40 font-sans text-[11px] text-[var(--text-main)] max-w-xs leading-relaxed">
                        <div className="truncate hover:text-clip">{w.tasksCompleted}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-sans">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedSite(w);
                            }}
                            className="p-1 rounded hover:bg-[var(--bg-surface)] text-blue-400 hover:text-blue-300 transition"
                            title="Inspect Complete Site Work Sheet"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(w);
                            }}
                            className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition"
                            title="Edit Site Activity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAuthorizedToDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDailyWork(w);
                              }}
                              className="p-1 rounded hover:bg-rose-500/20 text-[var(--text-dim)] hover:text-rose-400 transition cursor-pointer"
                              title="Delete Row Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Spreadsheet Total Footer Row */}
            {filteredWorks.length > 0 && (
              <tfoot>
                <tr className="bg-[var(--bg-surface)] border-t-2 border-[var(--border-main)] font-mono text-xs font-bold text-[var(--text-main)]">
                  <td colSpan={8} className="py-3 px-4 text-right font-sans uppercase text-[11px] text-[var(--text-dim)]">
                    Auto-Calculated Totals ({filteredWorks.length} Rows):
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 border-r border-[var(--border-main)]/40 font-mono">
                    {totalMeters.toLocaleString()} m
                  </td>
                  <td className="py-3 px-4 text-center text-purple-400 border-r border-[var(--border-main)]/40">
                    {totalPhotosCount} Photos
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-emerald-400 text-[11px] font-sans">
                    {completedCount} of {filteredWorks.length} Sites Completed (
                    {Math.round((completedCount / filteredWorks.length) * 100)}%)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* COMPLETED SITE WORK INSPECTOR MODAL */}
      {inspectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400">{inspectedSite.siteId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inspectedSite.status === 'Completed' || inspectedSite.isRowChecked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {inspectedSite.status === 'Completed' || inspectedSite.isRowChecked
                        ? 'Completed Site Work ✓'
                        : 'In Progress'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-main)] mt-0.5">
                    {inspectedSite.siteName || inspectedSite.projectName}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Project: {inspectedSite.projectCode} &bull; {inspectedSite.projectName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectedSite(null)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-1 space-y-4 text-xs mt-4">
              {/* Timing & Signoff Banner */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/30 via-[var(--bg-card)] to-transparent border border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">Activity Date</div>
                  <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">{inspectedSite.date}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">Completion Time</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">
                    {inspectedSite.completionDateTime || 'Completed'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">Crew Lead</div>
                  <div className="font-bold text-[var(--text-main)] mt-0.5">{inspectedSite.teamLead}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">Cable Laid</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">
                    {inspectedSite.metersInstalled.toLocaleString()} m
                  </div>
                </div>
              </div>

              {/* Tasks Description */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">
                  Completed Work Scope & Technical Tasks
                </label>
                <p className="mt-1 text-[var(--text-main)] leading-relaxed bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-main)]">
                  {inspectedSite.tasksCompleted}
                </p>
              </div>

              {inspectedSite.issuesEncountered && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">
                    Issues & Resolution Notes
                  </label>
                  <p className="mt-1 text-[var(--text-muted)] bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-main)]">
                    {inspectedSite.issuesEncountered}
                  </p>
                </div>
              )}

              {/* Work Photos Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-xs text-[var(--text-main)]">
                      Work Photos Taken for this Site ({inspectedSite.photos?.length || 0})
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-dim)]">
                    Captured during site work saving
                  </span>
                </div>

                {inspectedSite.photos && inspectedSite.photos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inspectedSite.photos.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] overflow-hidden flex flex-col group/card hover:border-purple-500/50 transition cursor-pointer"
                        onClick={() => setViewingPhoto({ photo: p, work: inspectedSite })}
                      >
                        <div className="h-40 bg-black/40 overflow-hidden relative">
                          <img
                            src={p.url}
                            alt={p.caption || 'Site Work Photo'}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition duration-300"
                          />
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white backdrop-blur-xs">
                            {p.fileSize || 'Image'}
                          </span>
                        </div>
                        <div className="p-2.5 space-y-1">
                          <p className="font-semibold text-[11px] text-[var(--text-main)] line-clamp-2">
                            {p.caption || p.name || 'Site Work Evidence'}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-dim)] font-mono">
                            <span>Uploaded: {p.uploadedAt}</span>
                            <span className="text-purple-400 flex items-center gap-0.5 font-bold">
                              <Eye className="w-3 h-3" /> View
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-[var(--border-main)] text-center text-[var(--text-dim)]">
                    <Camera className="w-6 h-6 mx-auto mb-1 opacity-40" />
                    <p className="text-xs font-semibold">No work photos were attached to this site log.</p>
                    <button
                      onClick={() => {
                        setInspectedSite(null);
                        handleOpenModal(inspectedSite);
                      }}
                      className="mt-2 text-xs text-purple-400 font-bold hover:underline"
                    >
                      + Upload Work Photos
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[var(--border-main)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectedSite;
                    setInspectedSite(null);
                    handleOpenModal(target);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Site Activity</span>
                </button>
                {isAuthorizedToDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (inspectedSite) {
                        handleDeleteDailyWork(inspectedSite);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
                    title="Permanently Delete this Site Work Sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Sheet Record</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setInspectedSite(null)}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL RESOLUTION PHOTO VIEWER MODAL */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
              <div>
                <span className="font-mono text-[10px] text-purple-400 font-bold">
                  {viewingPhoto.work.siteId} &bull; {viewingPhoto.work.siteName}
                </span>
                <h4 className="text-sm font-bold text-[var(--text-main)]">
                  {viewingPhoto.photo.caption || viewingPhoto.photo.name || 'Work Site Photograph'}
                </h4>
                <div className="text-[10px] text-[var(--text-dim)] font-mono mt-0.5">
                  Uploaded: {viewingPhoto.photo.uploadedAt} &bull; Size: {viewingPhoto.photo.fileSize || 'Image'}
                </div>
              </div>
              <button
                onClick={() => setViewingPhoto(null)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black/60 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={viewingPhoto.photo.url}
                alt={viewingPhoto.photo.caption || 'Full resolution view'}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-main)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] text-[11px]">
                Completed on {viewingPhoto.work.completionDateTime || viewingPhoto.work.date} by crew lead {viewingPhoto.work.teamLead}
              </span>
              <button
                onClick={() => setViewingPhoto(null)}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SITE ACTIVITY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingWork ? 'Edit Daily Site Activity' : 'Create Daily Site Activity & Excel Log'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Save site completion details, tasks, meters laid, and work evidence photos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDailyWorkForm} className="overflow-y-auto p-1 space-y-4 text-xs mt-4">
              {/* Site ID & Site Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Site ID / Node Tag *
                  </label>
                  <input
                    type="text"
                    name="siteId"
                    required
                    defaultValue={editingWork?.siteId || `SITE-FTTH-${Date.now().toString().slice(-4)}`}
                    placeholder="e.g. SITE-FTTH-G11-C4"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Site Name / Physical Location *
                  </label>
                  <input
                    type="text"
                    name="siteName"
                    required
                    defaultValue={editingWork?.siteName || ''}
                    placeholder="e.g. Sector G-11/3 Distribution Sub-Exchange"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              {/* Linked Project & Work Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Linked Infrastructure Project
                  </label>
                  <select
                    name="projectCode"
                    defaultValue={editingWork?.projectCode || projects[0]?.code}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-medium"
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
                    Work Activity Type
                  </label>
                  <select
                    name="workType"
                    defaultValue={editingWork?.workType || 'FTTH'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  >
                    <option value="FTTH">FTTH (Fiber to the Home)</option>
                    <option value="FTTB">FTTB (Fiber to the Building)</option>
                    <option value="FTTM">FTTM (Fiber to the Mast / 5G Tower)</option>
                    <option value="FAT Installation">FAT Installation & Drop Splicing</option>
                    <option value="Civil Ducting">Civil Ducting & Trenching</option>
                    <option value="Emergency Splicing">Emergency Optical Splicing</option>
                    <option value="Warehouse Logistics">Warehouse Logistics</option>
                  </select>
                </div>
              </div>

              {/* Date & Completion Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Activity Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingWork?.date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Completion Date & Time
                  </label>
                  <input
                    type="text"
                    name="completionDateTime"
                    defaultValue={
                      editingWork?.completionDateTime ||
                      `${new Date().toISOString().split('T')[0]} 17:30:00`
                    }
                    placeholder="YYYY-MM-DD HH:mm:ss"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Work Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingWork?.status || 'Completed'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-bold text-emerald-400"
                  >
                    <option value="Completed">Completed ✓</option>
                    <option value="Submitted">Submitted (Pending Inspection)</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Team Lead, Techs, Cable Laid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Crew / Lead Engineer
                  </label>
                  <input
                    type="text"
                    name="teamLead"
                    defaultValue={editingWork?.teamLead || currentUser?.fullName || 'Usman Ghani'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Technicians on Site
                  </label>
                  <input
                    type="number"
                    name="techniciansCount"
                    min={1}
                    defaultValue={editingWork?.techniciansCount || 4}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Cable Laid (Meters)
                  </label>
                  <input
                    type="number"
                    name="metersInstalled"
                    min={0}
                    defaultValue={editingWork?.metersInstalled || 650}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>

              {/* Tasks Completed */}
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Completed Tasks Description *
                </label>
                <textarea
                  name="tasksCompleted"
                  rows={2}
                  required
                  defaultValue={editingWork?.tasksCompleted || ''}
                  placeholder="e.g. Spliced 4 FAT boxes (FAT-17 to FAT-20). Terminated 64 drops and verified OTDR attenuation curves."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] leading-relaxed"
                />
              </div>

              {/* Issues Encountered & Weather */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Issues / Roadblocks Encountered
                  </label>
                  <input
                    type="text"
                    name="issuesEncountered"
                    defaultValue={editingWork?.issuesEncountered || 'None. Smooth deployment.'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Weather Condition
                  </label>
                  <input
                    type="text"
                    name="weatherCondition"
                    defaultValue={editingWork?.weatherCondition || 'Clear / 28°C'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              {/* WORK PHOTOS ATTACHMENT SECTION (Requirement 8) */}
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-xs text-[var(--text-main)]">
                      Work Photos Accordingly Site ({modalPhotos.length} Attached)
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-dim)]">
                    Upload from PC or enter image URL
                  </span>
                </div>

                {/* Upload Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {/* Upload from PC */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUploadFromPC}
                    className="hidden"
                    id="pc-photo-upload"
                  />
                  <label
                    htmlFor="pc-photo-upload"
                    className="px-3 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from PC</span>
                  </label>

                  {/* Online URL input */}
                  <div className="flex items-center gap-1.5 flex-1 w-full">
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="Or paste online photo URL..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] text-xs"
                    />
                    <input
                      type="text"
                      value={newPhotoCaption}
                      onChange={(e) => setNewPhotoCaption(e.target.value)}
                      placeholder="Caption..."
                      className="w-32 px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoByUrl}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] font-bold text-xs shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Attached Photos Grid */}
                {modalPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {modalPhotos.map((p) => (
                      <div
                        key={p.id}
                        className="relative rounded-lg border border-[var(--border-main)] overflow-hidden group/thumb bg-black/40"
                      >
                        <img
                          src={p.url}
                          alt={p.caption || 'Site Photo'}
                          className="w-full h-24 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(p.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white opacity-0 group-hover/thumb:opacity-100 transition shadow"
                          title="Remove Photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="p-1 bg-[var(--bg-card)]/90 backdrop-blur-xs text-[9px] text-[var(--text-main)] truncate font-semibold">
                          {p.caption || p.name || 'Site Photo'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[var(--border-main)] flex items-center justify-between gap-2">
                {editingWork && isAuthorizedToDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteDailyWork(editingWork);
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Delete this daily activity record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Save Site Work Activity</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Deletion Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!workToDelete}
        title="Delete Site Work Activity Record"
        itemName={workToDelete ? `${workToDelete.siteId || workToDelete.projectName} (${workToDelete.date})` : ''}
        entityName={workToDelete ? `${workToDelete.siteId || workToDelete.projectName}` : ''}
        itemType="site activity record"
        entityType="Daily Field Activity"
        warningMessage="This daily site activity entry, technician details, and associated site evidence photos will be permanently removed from the operations database."
        description="This daily site activity entry, technician details, and associated site evidence photos will be permanently removed from the operations database."
        onConfirm={handleConfirmDeleteWork}
        onClose={() => setWorkToDelete(null)}
        isLoading={isDeletingWork}
      />
    </div>
  );
};
