/**
 * DataLens Frontend Tests — Vitest
 * Run: npm test  (from frontend/)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// ── Mock axios / api utils before importing components ────────────────────

vi.mock('../utils/api', () => ({
  uploadCSV: vi.fn(),
  getProfile: vi.fn(() => Promise.resolve({ data: [] })),
  getCharts: vi.fn(() => Promise.resolve({ data: { charts: [], filtered_rows: 0, total_rows: 0 } })),
  getFilterOpts: vi.fn(() => Promise.resolve({ data: {} })),
  getSummary: vi.fn(),
  sendChat: vi.fn(),
  clearChat: vi.fn(() => Promise.resolve()),
  resetAll: vi.fn(),
  activateDataset: vi.fn(),
}))

import { uploadCSV, getProfile, getCharts, getFilterOpts, sendChat } from '../utils/api'
import App from '../App.jsx'
import DataProfile from '../pages/DataProfile.jsx'
import Summary from '../pages/Summary.jsx'
import AIAssistant from '../pages/AIAssistant.jsx'
import Visualizations from '../pages/Visualizations.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────

const FILE_INFO = {
  filename: 'test.csv',
  rows: 100,
  columns: 4,
  column_info: [
    { name: 'age', dtype: 'int64', type: 'numeric' },
    { name: 'city', dtype: 'object', type: 'categorical' },
  ],
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('App — Upload Landing', () => {
  it('renders the upload dropzone on initial load', () => {
    render(<App />)
    expect(screen.getByText(/Drag & drop your CSV file/i)).toBeTruthy()
  })

  it('shows the DataLens brand name', () => {
    render(<App />)
    expect(screen.getAllByText(/DataLens/i).length).toBeGreaterThan(0)
  })

  it('shows all four feature cards', () => {
    render(<App />)
    expect(screen.getByText(/4–6 Smart Charts/i)).toBeTruthy()
    expect(screen.getByText(/Column Statistics/i)).toBeTruthy()
    expect(screen.getByText(/AI Summary/i)).toBeTruthy()
    expect(screen.getByText(/Chat Assistant/i)).toBeTruthy()
  })
})

describe('DataProfile page', () => {
  it('renders loading state initially', async () => {
    getProfile.mockReturnValueOnce(new Promise(() => {})) // hang
    render(<DataProfile />)
    expect(screen.getByText(/Computing statistics/i)).toBeTruthy()
  })

  it('renders profile table with columns when data loads', async () => {
    getProfile.mockResolvedValueOnce({
      data: [
        { column: 'age', type: 'numeric', count: 100, null_pct: 0, nulls: 0, unique: 50,
          mean: 30, median: 29, std: 5, min: 18, max: 65, q25: 25, q75: 40 },
        { column: 'city', type: 'categorical', count: 100, null_pct: 2, nulls: 2, unique: 8,
          mean: null, median: null, std: null, min: null, max: null, q25: null, q75: null },
      ],
    })
    render(<DataProfile />)
    await waitFor(() => expect(screen.getByText('age')).toBeTruthy())
    expect(screen.getByText('city')).toBeTruthy()
  })
})

describe('Visualizations page', () => {
  it('shows loading state while fetching charts', () => {
    getCharts.mockReturnValueOnce(new Promise(() => {}))
    getFilterOpts.mockResolvedValueOnce({ data: {} })
    render(<Visualizations fileInfo={FILE_INFO} />)
    expect(screen.getByText(/Generating visualizations/i)).toBeTruthy()
  })

  it('renders "No data" gracefully when charts array is empty', async () => {
    getCharts.mockResolvedValueOnce({ data: { charts: [], filtered_rows: 0, total_rows: 0 } })
    getFilterOpts.mockResolvedValueOnce({ data: {} })
    render(<Visualizations fileInfo={FILE_INFO} />)
    await waitFor(() => expect(screen.queryByText(/Generating visualizations/i)).toBeNull())
    // Empty charts — no crash
  })
})

describe('Summary page', () => {
  it('shows generate button before generation', () => {
    render(<Summary />)
    expect(screen.getByText(/Generate Executive Summary/i)).toBeTruthy()
  })

  it('calls getSummary when button is clicked and shows result', async () => {
    const { getSummary } = await import('../utils/api')
    getSummary.mockResolvedValueOnce({
      data: { summary: 'This dataset contains sales data.', filename: 'test.csv', rows: 100, columns: 4 },
    })
    render(<Summary />)
    fireEvent.click(screen.getByText(/Generate Executive Summary/i))
    await waitFor(() => expect(screen.getByText(/sales data/i)).toBeTruthy())
  })
})

describe('AI Assistant', () => {
  it('renders welcome message on load', () => {
    render(<AIAssistant fileInfo={FILE_INFO} />)
    expect(screen.getByText(/DataLens AI/i)).toBeTruthy()
  })

  it('sends a message when Enter is pressed', async () => {
    sendChat.mockResolvedValueOnce({ data: { reply: 'The average age is 30.' } })
    render(<AIAssistant fileInfo={FILE_INFO} />)
    const textarea = screen.getByPlaceholderText(/Ask anything/i)
    fireEvent.change(textarea, { target: { value: 'What is the average age?' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    await waitFor(() => expect(sendChat).toHaveBeenCalledWith('What is the average age?'))
  })

  it('displays AI reply in the chat', async () => {
    sendChat.mockResolvedValueOnce({ data: { reply: 'Average age is 30 years.' } })
    render(<AIAssistant fileInfo={FILE_INFO} />)
    const textarea = screen.getByPlaceholderText(/Ask anything/i)
    fireEvent.change(textarea, { target: { value: 'Average age?' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    await waitFor(() => expect(screen.getByText(/Average age is 30 years/i)).toBeTruthy())
  })

  it('shows suggested questions in the sidebar', () => {
    render(<AIAssistant fileInfo={FILE_INFO} />)
    expect(screen.getByText(/main patterns/i)).toBeTruthy()
  })
})
