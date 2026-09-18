import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
}

interface SearchAndFilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  statusOptions?: { label: string; value: string }[];
  categoryOptions?: { label: string; value: string }[];
  placeholder?: string;
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  filters,
  onFilterChange,
  statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Pending Consent', value: 'PENDING_CONSENT' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Rejected', value: 'REJECTED' },
  ],
  categoryOptions = [],
  placeholder = 'Search by ID, applicant name, scheme...',
}) => {
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, statusFilter: e.target.value });
  };

  const handleCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, categoryFilter: e.target.value });
  };

  const handleClear = () => {
    onFilterChange({
      searchQuery: '',
      statusFilter: 'ALL',
      categoryFilter: 'ALL',
    });
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.statusFilter !== 'ALL' ||
    filters.categoryFilter !== 'ALL';

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={handleSearch}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </div>

        <select
          value={filters.statusFilter}
          onChange={handleStatus}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {categoryOptions.length > 0 && (
          <select
            value={filters.categoryFilter}
            onChange={handleCategory}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
