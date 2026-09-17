import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  Building2, Users, Mail, Phone, Shield, CheckCircle2, UserCheck, PlusCircle
} from 'lucide-react';

export const DepartmentsOfficers = () => {
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, oRes] = await Promise.all([
          apiClient.get('/departments'),
          apiClient.get('/departments/officers')
        ]);
        setDepartments(dRes.data);
        setOfficers(oRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading department directory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Municipal Departments & Officers</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Directory of municipal authorities, jurisdiction codes, and active field resolution squads
        </p>
      </div>

      {/* Departments Grid */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-civic-400" />
          Registered Departments ({departments.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept) => {
            const deptOfficers = officers.filter((o) => o.department_id === dept.id);
            return (
              <div key={dept.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-civic-500/20 text-civic-300 border border-civic-500/30">
                    {dept.code}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-civic-400" /> {deptOfficers.length} Officers
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-1">{dept.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {dept.description}
                </p>

                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                  {dept.contact_email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{dept.contact_email}</span>
                    </div>
                  )}
                  {dept.contact_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{dept.contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Officers List Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          Field Resolution Officers ({officers.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Officer Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Badge No.</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {officers.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-semibold text-white">
                    {o.user?.name}
                    <div className="text-[10px] text-slate-400 font-normal">{o.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {o.department?.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-civic-400 font-bold">
                    {o.badge_number || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {o.designation}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active On Duty
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
