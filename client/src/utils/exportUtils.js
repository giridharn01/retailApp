import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

const formatters = {
  currency: (value) => {
    const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
    // Replace currency symbol with safe text to avoid encoding issues
    return formatted.replace('₹', 'Rs. ');
  },
  number: (value) => new Intl.NumberFormat('en-IN').format(value || 0),
  percentage: (value) => `${(value || 0).toFixed(1)}%`,
  date: (date) => {
    try {
      return new Intl.DateTimeFormat('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(new Date(date));
    } catch (error) {
      return new Date(date).toLocaleDateString('en-US');
    }
  }
};

// =================================================================
// ENHANCED PDF TEMPLATE CLASS
// =================================================================

class PDFTemplate {
  constructor() {
    this.pdf = new jsPDF('p', 'pt', 'a4');
    this.currentY = 50;
    this.pageHeight = 841.89;
    this.pageWidth = 595.28;
    this.margin = 40;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.lineHeight = 12;
    
    // Set default font encoding to avoid issues
    this.pdf.setFont('helvetica');
    this.pdf.setCharSpace(0);
    
    // Color palette
    this.colors = {
      primary: [31, 81, 136],      // Professional blue
      secondary: [52, 152, 219],   // Light blue
      accent: [230, 126, 34],      // Orange
      success: [39, 174, 96],      // Green
      warning: [241, 196, 15],     // Yellow
      danger: [231, 76, 60],       // Red
      text: [52, 73, 94],          // Dark gray
      lightText: [149, 165, 166],  // Light gray
      background: [236, 240, 241], // Very light gray
      white: [255, 255, 255]
    };
  }

  checkPageBreak(requiredHeight = 50) {
    if (this.currentY + requiredHeight > this.pageHeight - 80) {
      this.addPage();
    }
    return this;
  }

  // Safe text helper to avoid encoding issues
  safeText(text, x, y, options = {}) {
    try {
      // Clean text of problematic characters
      const cleanText = String(text)
        .replace(/[^\u0020-\u007E]/g, '') // Remove non-printable ASCII characters
        .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
        .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
        .replace(/\u2013/g, '-') // Replace en dash
        .replace(/\u2014/g, '--') // Replace em dash
        .replace(/\u2026/g, '...'); // Replace ellipsis
      
      this.pdf.text(cleanText, x, y, options);
    } catch (error) {
      console.warn('Text encoding issue, using fallback:', error);
      this.pdf.text(String(text).substring(0, 50), x, y, options);
    }
    return this;
  }

  addPage() {
    this.pdf.addPage();
    this.currentY = 50;
    this.addPageNumber();
    return this;
  }

  addPageNumber() {
    const pageCount = this.pdf.internal.getNumberOfPages();
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...this.colors.lightText);
    this.pdf.text(`Page ${pageCount}`, this.pageWidth - 60, this.pageHeight - 30);
    return this;
  }

  addHeader(title, subtitle, date) {
    // Header background with gradient effect
    this.pdf.setFillColor(...this.colors.primary);
    this.pdf.rect(0, 0, this.pageWidth, 100, 'F');
    
    // Add subtle gradient effect with lighter overlay
    this.pdf.setFillColor(255, 255, 255, 0.1);
    this.pdf.rect(0, 80, this.pageWidth, 20, 'F');
    
    // Company logo area (placeholder) - better positioning
    this.pdf.setFillColor(...this.colors.white);
    this.pdf.circle(this.margin + 25, 45, 20, 'F');
    this.pdf.setTextColor(...this.colors.primary);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.text('PA', this.margin + 20, 50);
    
    // Company name - properly aligned
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(22);
    this.safeText('PALANI ANDAVAR', this.margin + 55, 30);
    
    // Tagline - aligned with company name
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.safeText('Agricultural & Retail Solutions', this.margin + 55, 45);
    
    // Report title - better spacing
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.safeText(title, this.margin + 55, 65);
    
    // Subtitle - consistent alignment
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.safeText(subtitle, this.margin + 55, 80);
    
    // Date - properly right aligned with margin
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    const dateText = `Generated: ${formatters.date(date)}`;
    const dateWidth = this.pdf.getTextWidth(dateText);
    this.safeText(dateText, this.pageWidth - this.margin - dateWidth, 30);
    
    this.currentY = 115;
    this.addPageNumber();
    return this;
  }

  addSection(title) {
    this.checkPageBreak(30);
    
    // Section background
    this.pdf.setFillColor(...this.colors.background);
    this.pdf.rect(this.margin, this.currentY - 5, this.contentWidth, 20, 'F');
    
    // Section title without icon
    this.pdf.setTextColor(...this.colors.primary);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.safeText(title.toUpperCase(), this.margin + 10, this.currentY + 10);
    
    this.currentY += 25;
    return this;
  }

  addSubsection(title) {
    this.checkPageBreak(25);
    this.pdf.setTextColor(...this.colors.text);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.text(title, this.margin + 10, this.currentY);
    this.currentY += 15;
    return this;
  }

  addBusinessHealthCard(score, description) {
    this.checkPageBreak(90);
    
    // Health card background
    const cardColor = score >= 80 ? this.colors.success : 
                     score >= 60 ? this.colors.warning : this.colors.danger;
    
    this.pdf.setFillColor(...this.colors.white);
    this.pdf.rect(this.margin, this.currentY, this.contentWidth, 80, 'F');
    this.pdf.setDrawColor(...this.colors.background);
    this.pdf.setLineWidth(1);
    this.pdf.rect(this.margin, this.currentY, this.contentWidth, 80, 'S');
    
    // Health score circle - better positioning
    const circleX = this.pageWidth - 100;
    const circleY = this.currentY + 40;
    this.pdf.setFillColor(...cardColor);
    this.pdf.circle(circleX, circleY, 28, 'F');
    
    // Score text - properly centered
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(24);
    const scoreText = `${score}`;
    const scoreWidth = this.pdf.getTextWidth(scoreText);
    this.safeText(scoreText, circleX - scoreWidth/2, circleY + 8);
    
    // "/100" smaller text - properly positioned
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...this.colors.white);
    this.safeText('/100', circleX + scoreWidth/2 + 2, circleY + 4);
    
    // Health label - better alignment
    this.pdf.setTextColor(...this.colors.text);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.text('BUSINESS HEALTH SCORE', this.margin + 20, this.currentY + 25);
    
    // Description - wrapped text
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...this.colors.lightText);
    const descLines = this.pdf.splitTextToSize(description, this.contentWidth - 150);
    descLines.forEach((line, index) => {
      this.pdf.text(line, this.margin + 20, this.currentY + 45 + (index * 12));
    });
    
    // Period indicator
    this.pdf.setFontSize(9);
    this.pdf.text('Assessment Period: Current Quarter', this.margin + 20, this.currentY + 70);
    
    this.currentY += 95;
    return this;
  }

  addKPIGrid(metrics) {
    this.checkPageBreak(120);
    
    const colWidth = (this.contentWidth - 20) / 3; // Better spacing
    const rowHeight = 45; // Reduced from 55
    let x = this.margin + 10; // Start with small offset
    let y = this.currentY;
    
    metrics.forEach((metric, index) => {
      if (index > 0 && index % 3 === 0) {
        y += rowHeight + 10; // Reduced from 15
        x = this.margin + 10;
      }
      
      // KPI card with better spacing
      this.pdf.setFillColor(...this.colors.white);
      this.pdf.rect(x, y, colWidth - 10, rowHeight, 'F');
      this.pdf.setDrawColor(...this.colors.background);
      this.pdf.setLineWidth(1);
      this.pdf.rect(x, y, colWidth - 10, rowHeight, 'S');
      
      // Metric icon/indicator - better positioning
      const indicatorColor = metric.trend === 'up' ? this.colors.success : 
                           metric.trend === 'down' ? this.colors.danger : this.colors.warning;
      this.pdf.setFillColor(...indicatorColor);
      this.pdf.rect(x + 8, y + 8, 4, 39, 'F');
      
      // Metric value - center aligned
      this.pdf.setTextColor(...this.colors.text);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(13);
      this.pdf.text(metric.value, x + 18, y + 22);
      
      // Metric label - consistent positioning
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(...this.colors.lightText);
      this.pdf.text(metric.label, x + 18, y + 38);
      
      // Trend indicator - better alignment with safe symbols
      if (metric.change) {
        this.pdf.setTextColor(...indicatorColor);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(8);
        const trendSymbol = metric.trend === 'up' ? '^' : metric.trend === 'down' ? 'v' : '-';
        this.pdf.text(`${trendSymbol} ${metric.change}`, x + 18, y + 48);
      }
      
      x += colWidth;
    });
    
    this.currentY = y + rowHeight + 15; // Reduced from 25
    return this;
  }

  // Visual Chart Drawing Methods
  drawLineChart(title, data, options = {}) {
    const chartHeight = options.height || 160; // Reduced from 180
    const chartWidth = options.width || (this.contentWidth - 80);
    const chartX = this.margin + 40;
    const chartY = this.currentY + 20; // Reduced from 30
    
    this.checkPageBreak(chartHeight + 60); // Reduced from 80
    this.addSubsection(title);
    
    if (!data || data.length === 0) {
      this.pdf.setTextColor(...this.colors.lightText);
      this.pdf.setFontSize(10);
      this.pdf.text('No data available', chartX, chartY + chartHeight/2);
      this.currentY += chartHeight + 40;
      return this;
    }
    
    // Find min and max values for scaling
    const values = data.map(item => item.value || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values, 0);
    const valueRange = maxValue - minValue || 1;
    
    // Draw chart background
    this.pdf.setFillColor(248, 249, 250);
    this.pdf.rect(chartX, chartY, chartWidth, chartHeight, 'F');
    
    // Draw grid lines
    this.pdf.setDrawColor(...this.colors.background);
    this.pdf.setLineWidth(0.5);
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = chartY + (chartHeight * i / 5);
      this.pdf.line(chartX, y, chartX + chartWidth, y);
    }
    
    // Vertical grid lines
    const stepX = chartWidth / (data.length - 1 || 1);
    for (let i = 0; i < data.length; i++) {
      const x = chartX + (stepX * i);
      this.pdf.line(x, chartY, x, chartY + chartHeight);
    }
    
    // Draw axes
    this.pdf.setDrawColor(...this.colors.text);
    this.pdf.setLineWidth(1);
    this.pdf.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // X-axis
    this.pdf.line(chartX, chartY, chartX, chartY + chartHeight); // Y-axis
    
    // Plot data points and line
    if (data.length > 1) {
      this.pdf.setDrawColor(...this.colors.primary);
      this.pdf.setLineWidth(2);
      
      for (let i = 0; i < data.length - 1; i++) {
        const x1 = chartX + (stepX * i);
        const y1 = chartY + chartHeight - ((values[i] - minValue) / valueRange * chartHeight);
        const x2 = chartX + (stepX * (i + 1));
        const y2 = chartY + chartHeight - ((values[i + 1] - minValue) / valueRange * chartHeight);
        
        this.pdf.line(x1, y1, x2, y2);
      }
    }
    
    // Draw data points
    this.pdf.setFillColor(...this.colors.primary);
    data.forEach((item, index) => {
      const x = chartX + (stepX * index);
      const y = chartY + chartHeight - ((values[index] - minValue) / valueRange * chartHeight);
      this.pdf.circle(x, y, 3, 'F');
    });
    
    // Add labels - improved alignment
    this.pdf.setTextColor(...this.colors.text);
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    
    // X-axis labels - properly centered
    data.forEach((item, index) => {
      const x = chartX + (stepX * index);
      const label = item.label || `Point ${index + 1}`;
      const labelWidth = this.pdf.getTextWidth(label);
      // Ensure label doesn't go beyond chart bounds
      const labelX = Math.max(chartX, Math.min(x - labelWidth/2, chartX + chartWidth - labelWidth));
      this.pdf.text(label, labelX, chartY + chartHeight + 18);
    });
    
    // Y-axis labels - right aligned to axis
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange * i / 5);
      const y = chartY + chartHeight - (chartHeight * i / 5);
      const label = options.formatValue ? options.formatValue(value) : value.toFixed(0);
      const labelWidth = this.pdf.getTextWidth(label);
      this.pdf.text(label, chartX - labelWidth - 8, y + 3);
    }
    
    this.currentY += chartHeight + 30; // Reduced from 50
    return this;
  }

  drawBarChart(title, data, options = {}) {
    const chartHeight = options.height || 180; // Reduced from 200
    const chartWidth = options.width || (this.contentWidth - 80);
    const chartX = this.margin + 40;
    const chartY = this.currentY + 20; // Reduced from 30
    
    this.checkPageBreak(chartHeight + 80);
    this.addSubsection(title);
    
    if (!data || data.length === 0) {
      this.pdf.setTextColor(...this.colors.lightText);
      this.pdf.setFontSize(10);
      this.pdf.text('No data available', chartX, chartY + chartHeight/2);
      this.currentY += chartHeight + 40;
      return this;
    }
    
    // Find max value for scaling
    const values = data.map(item => item.value || 0);
    const maxValue = Math.max(...values) || 1;
    
    // Draw chart background
    this.pdf.setFillColor(248, 249, 250);
    this.pdf.rect(chartX, chartY, chartWidth, chartHeight, 'F');
    
    // Draw grid lines
    this.pdf.setDrawColor(...this.colors.background);
    this.pdf.setLineWidth(0.5);
    for (let i = 0; i <= 5; i++) {
      const y = chartY + (chartHeight * i / 5);
      this.pdf.line(chartX, y, chartX + chartWidth, y);
    }
    
    // Draw axes
    this.pdf.setDrawColor(...this.colors.text);
    this.pdf.setLineWidth(1);
    this.pdf.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // X-axis
    this.pdf.line(chartX, chartY, chartX, chartY + chartHeight); // Y-axis
    
    // Calculate bar dimensions
    const barWidth = (chartWidth - 20) / data.length - 5;
    const barSpacing = 5;
    
    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * (chartHeight - 10);
      const x = chartX + 10 + (index * (barWidth + barSpacing));
      const y = chartY + chartHeight - barHeight;
      
      // Bar color rotation
      const colorIndex = index % 4;
      const barColors = [this.colors.primary, this.colors.secondary, this.colors.accent, this.colors.success];
      this.pdf.setFillColor(...barColors[colorIndex]);
      this.pdf.rect(x, y, barWidth, barHeight, 'F');
      
      // Value label on top of bar - center aligned
      this.pdf.setTextColor(...this.colors.text);
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'bold');
      const valueLabel = item.displayValue || item.value.toString();
      const valueLabelWidth = this.pdf.getTextWidth(valueLabel);
      this.pdf.text(valueLabel, x + (barWidth - valueLabelWidth)/2, Math.max(y - 8, chartY + 15));
      
      // X-axis label - center aligned and truncated if needed
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      let label = item.label || `Item ${index + 1}`;
      // Truncate label if too long for bar width
      while (this.pdf.getTextWidth(label) > barWidth - 4 && label.length > 3) {
        label = label.substring(0, label.length - 4) + '...';
      }
      const labelWidth = this.pdf.getTextWidth(label);
      this.pdf.text(label, x + (barWidth - labelWidth)/2, chartY + chartHeight + 18);
    });
    
    // Y-axis labels - right aligned to axis
    this.pdf.setTextColor(...this.colors.text);
    this.pdf.setFontSize(8);
    for (let i = 0; i <= 5; i++) {
      const value = (maxValue * i / 5);
      const y = chartY + chartHeight - (chartHeight * i / 5);
      const label = options.formatValue ? options.formatValue(value) : value.toFixed(0);
      const labelWidth = this.pdf.getTextWidth(label);
      this.pdf.text(label, chartX - labelWidth - 8, y + 3);
    }
    
    this.currentY += chartHeight + 50;
    return this;
  }

  drawPieChart(title, data, options = {}) {
    const chartSize = options.size || 140;
    const chartX = this.margin + (this.contentWidth / 2);
    const chartY = this.currentY + 30 + chartSize/2;
    
    this.checkPageBreak(chartSize + 80);
    this.addSubsection(title);
    
    if (!data || data.length === 0) {
      this.pdf.setTextColor(...this.colors.lightText);
      this.pdf.setFontSize(10);
      this.safeText('No data available', chartX - 50, chartY);
      this.currentY += chartSize + 40;
      return this;
    }
    
    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    
    // For now, create a simple bar representation instead of pie chart
    // since jsPDF doesn't have good pie chart support
    
    let legendY = chartY - chartSize/3;
    const colors = [this.colors.primary, this.colors.secondary, this.colors.accent, 
                   this.colors.success, this.colors.warning, this.colors.danger];
    
    data.forEach((item, index) => {
      const colorIndex = index % colors.length;
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      
      // Legend color box
      this.pdf.setFillColor(...colors[colorIndex]);
      this.pdf.rect(chartX - chartSize/2, legendY - 5, 12, 12, 'F');
      
      // Legend text
      this.pdf.setTextColor(...this.colors.text);
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      this.safeText(`${item.label}: ${percentage}% (${item.value})`, chartX - chartSize/2 + 18, legendY + 3);
      
      legendY += 18;
    });
    
    this.currentY += Math.max(data.length * 18 + 60, chartSize + 40);
    return this;
  }

  drawAreaChart(title, data, options = {}) {
    const chartHeight = options.height || 160;
    const chartWidth = options.width || (this.contentWidth - 80);
    const chartX = this.margin + 40;
    const chartY = this.currentY + 30;
    
    this.checkPageBreak(chartHeight + 80);
    this.addSubsection(title);
    
    if (!data || data.length === 0) {
      this.pdf.setTextColor(...this.colors.lightText);
      this.pdf.setFontSize(10);
      this.pdf.text('No data available', chartX, chartY + chartHeight/2);
      this.currentY += chartHeight + 40;
      return this;
    }
    
    // Find min and max values for scaling
    const values = data.map(item => item.value || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values, 0);
    const valueRange = maxValue - minValue || 1;
    
    // Draw chart background
    this.pdf.setFillColor(248, 249, 250);
    this.pdf.rect(chartX, chartY, chartWidth, chartHeight, 'F');
    
    // Create area path points
    const stepX = chartWidth / (data.length - 1 || 1);
    const areaPoints = [];
    
    // Add baseline points
    areaPoints.push([chartX, chartY + chartHeight]);
    
    // Add data points
    data.forEach((item, index) => {
      const x = chartX + (stepX * index);
      const y = chartY + chartHeight - ((values[index] - minValue) / valueRange * chartHeight);
      areaPoints.push([x, y]);
    });
    
    // Close the area
    areaPoints.push([chartX + chartWidth, chartY + chartHeight]);
    
    // Draw filled area
    this.pdf.setFillColor(...this.colors.secondary, 0.3); // Semi-transparent
    
    // Since jsPDF doesn't have polygon fill, we'll simulate with multiple lines
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = chartX + (stepX * i);
      const y1 = chartY + chartHeight - ((values[i] - minValue) / valueRange * chartHeight);
      const x2 = chartX + (stepX * (i + 1));
      const y2 = chartY + chartHeight - ((values[i + 1] - minValue) / valueRange * chartHeight);
      
      // Draw vertical lines to create area effect
      this.pdf.setDrawColor(...this.colors.secondary);
      this.pdf.setLineWidth(1);
      for (let j = 0; j < 20; j++) {
        const x = x1 + ((x2 - x1) * j / 20);
        const y = y1 + ((y2 - y1) * j / 20);
        this.pdf.line(x, y, x, chartY + chartHeight);
      }
    }
    
    // Draw line on top
    this.pdf.setDrawColor(...this.colors.primary);
    this.pdf.setLineWidth(2);
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = chartX + (stepX * i);
      const y1 = chartY + chartHeight - ((values[i] - minValue) / valueRange * chartHeight);
      const x2 = chartX + (stepX * (i + 1));
      const y2 = chartY + chartHeight - ((values[i + 1] - minValue) / valueRange * chartHeight);
      
      this.pdf.line(x1, y1, x2, y2);
    }
    
    // Draw data points
    this.pdf.setFillColor(...this.colors.primary);
    data.forEach((item, index) => {
      const x = chartX + (stepX * index);
      const y = chartY + chartHeight - ((values[index] - minValue) / valueRange * chartHeight);
      this.pdf.circle(x, y, 3, 'F');
    });
    
    // Add axes and labels (similar to line chart)
    this.pdf.setDrawColor(...this.colors.text);
    this.pdf.setLineWidth(1);
    this.pdf.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
    this.pdf.line(chartX, chartY, chartX, chartY + chartHeight);
    
    // Add labels
    this.pdf.setTextColor(...this.colors.text);
    this.pdf.setFontSize(8);
    
    // X-axis labels
    data.forEach((item, index) => {
      const x = chartX + (stepX * index);
      const label = item.label || `Point ${index + 1}`;
      const labelWidth = this.pdf.getTextWidth(label);
      this.pdf.text(label, x - labelWidth/2, chartY + chartHeight + 15);
    });
    
    this.currentY += chartHeight + 50;
    return this;
  }

  addInsightBox(insights) {
    this.checkPageBreak(insights.length * 25 + 40);
    
    // Insights container
    this.pdf.setFillColor(248, 249, 250);
    this.pdf.rect(this.margin, this.currentY, this.contentWidth, insights.length * 18 + 20, 'F'); // Reduced container size
    this.pdf.setDrawColor(...this.colors.secondary);
    this.pdf.rect(this.margin, this.currentY, this.contentWidth, insights.length * 18 + 20, 'S');
    
    this.currentY += 10; // Reduced from 15
    
    insights.forEach((insight, index) => {
      // Insight bullet
      const bulletColor = insight.type === 'success' ? this.colors.success :
                         insight.type === 'warning' ? this.colors.warning :
                         insight.type === 'danger' ? this.colors.danger : this.colors.secondary;
      
      this.pdf.setFillColor(...bulletColor);
      this.pdf.circle(this.margin + 15, this.currentY, 3, 'F');
      
      // Insight text
      this.pdf.setTextColor(...this.colors.text);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(10);
      
      // Word wrap for long insights
      const lines = this.pdf.splitTextToSize(insight.text, this.contentWidth - 40);
      lines.forEach((line, lineIndex) => {
        this.pdf.text(line, this.margin + 25, this.currentY + (lineIndex * 12));
      });
      
      this.currentY += Math.max(lines.length * 12, 15); // Reduced from 18
    });
    
    this.currentY += 10; // Reduced from 15
    return this;
  }

  addDataTable(title, headers, rows, options = {}) {
    this.checkPageBreak(50);
    
    if (title) {
      this.addSubsection(title);
    }
    
    this.pdf.autoTable({
      startY: this.currentY,
      head: [headers],
      body: rows,
      margin: { left: this.margin, right: this.margin },
      theme: 'striped',
      headStyles: {
        fillColor: this.colors.primary,
        textColor: this.colors.white,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 8,
        textColor: this.colors.text
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { halign: 'left' },
        ...options.columnStyles
      },
      styles: {
        overflow: 'linebreak',
        lineWidth: 0.5,
        lineColor: this.colors.background
      },
      ...options
    });
    
    this.currentY = this.pdf.lastAutoTable.finalY + 20;
    return this;
  }

  addRecommendations(recommendations) {
    this.checkPageBreak(50);
    this.addSection('Strategic Recommendations');
    
    recommendations.forEach((rec, index) => {
      this.checkPageBreak(40);
      
      // Priority indicator
      const priorityColors = {
        high: this.colors.danger,
        medium: this.colors.warning,
        low: this.colors.success
      };
      
      const priorityColor = priorityColors[rec.priority] || this.colors.secondary;
      this.pdf.setFillColor(...priorityColor);
      this.pdf.rect(this.margin + 10, this.currentY - 5, 4, 25, 'F');
      
      // Recommendation title
      this.pdf.setTextColor(...this.colors.text);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(11);
      this.pdf.text(`${index + 1}. ${rec.title}`, this.margin + 20, this.currentY + 5);
      
      // Recommendation description
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...this.colors.lightText);
      const lines = this.pdf.splitTextToSize(rec.description, this.contentWidth - 30);
      lines.forEach((line, lineIndex) => {
        this.pdf.text(line, this.margin + 20, this.currentY + 18 + (lineIndex * 12));
      });
      
      this.currentY += Math.max(lines.length * 12 + 18, 35);
    });
    
    return this;
  }

  save(filename) {
    this.pdf.save(filename);
    return this;
  }
}

// =================================================================
// EXCEL TEMPLATE CLASS
// =================================================================

class ExcelTemplate {
  constructor() {
    this.workbook = XLSX.utils.book_new();
  }

  createDashboardSheet(data) {
    const ws_data = [
      ['PALANI ANDAVAR - EXECUTIVE DASHBOARD'],
      ['Generated:', formatters.date(new Date())],
      [],
      ['BUSINESS OVERVIEW'],
      ['Total Revenue', formatters.currency(data.summary?.sales?.totalRevenue || 0)],
      ['Total Orders', data.summary?.sales?.totalOrders || 0],
      ['Service Requests', data.summary?.services?.totalRequests || 0],
      ['Completion Rate', `${data.summary?.services?.completionRate || 0}%`],
      [],
      ['SALES DATA'],
      ['Date', 'Revenue', 'Orders', 'Avg Order Value']
    ];

    data.salesData?.forEach(item => {
      ws_data.push([
        formatters.date(item._id),
        item.totalSales || 0,
        item.orderCount || 0,
        item.averageOrder || 0
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(this.workbook, ws, 'Dashboard');
    return this;
  }

  createSalesSheet(data) {
    const ws_data = [
      ['SALES PERFORMANCE REPORT'],
      ['Total Revenue', formatters.currency(data.summary?.sales?.totalRevenue || 0)],
      ['Total Orders', data.summary?.sales?.totalOrders || 0],
      ['Average Order Value', formatters.currency(data.summary?.sales?.averageOrderValue || 0)],
      [],
      ['DATE-WISE PERFORMANCE'],
      ['Date', 'Revenue', 'Orders', 'Avg Order Value']
    ];

    data.salesData?.forEach(item => {
      ws_data.push([
        formatters.date(item._id),
        item.totalSales || 0,
        item.orderCount || 0,
        item.averageOrder || 0
      ]);
    });

    if (data.topProducts?.length) {
      ws_data.push([]);
      ws_data.push(['TOP PRODUCTS']);
      ws_data.push(['Product', 'Category', 'Units Sold', 'Revenue']);
      
      data.topProducts.forEach(product => {
        ws_data.push([
          product.product?.name || 'Unknown',
          product.product?.category || 'N/A',
          product.totalSold || 0,
          product.revenue || 0
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(this.workbook, ws, 'Sales');
    return this;
  }

  createServicesSheet(data) {
    const ws_data = [
      ['SERVICES PERFORMANCE REPORT'],
      ['Total Requests', data.summary?.services?.totalRequests || 0],
      ['Completed', data.summary?.services?.completedRequests || 0],
      ['Pending', data.summary?.services?.pendingRequests || 0],
      ['Completion Rate', `${data.summary?.services?.completionRate || 0}%`],
      [],
      ['REQUESTS BY STATUS'],
      ['Status', 'Count']
    ];

    data.requestsByStatus?.forEach(item => {
      ws_data.push([item._id, item.count]);
    });

    if (data.requestsByServiceType?.length) {
      ws_data.push([]);
      ws_data.push(['REQUESTS BY SERVICE TYPE']);
      ws_data.push(['Service Type', 'Count']);
      
      data.requestsByServiceType.forEach(item => {
        ws_data.push([item._id, item.count]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(this.workbook, ws, 'Services');
    return this;
  }

  save(filename) {
    const buf = XLSX.write(this.workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
  }
}

// =================================================================
// EXPORT FUNCTIONS
// =================================================================

export const exportDashboardPDF = (data, startDate, endDate) => {
  const pdf = new PDFTemplate();
  
  // Calculate metrics
  const salesData = data.salesData || [];
  const totalRevenue = salesData.reduce((sum, item) => sum + (item.totalSales || 0), 0);
  const totalOrders = salesData.reduce((sum, item) => sum + (item.orderCount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const serviceRequests = data.requestsByStatus || [];
  const totalRequests = serviceRequests.reduce((sum, item) => sum + (item.count || 0), 0);
  const completedRequests = serviceRequests.find(s => s._id === 'Completed')?.count || 0;
  const completionRate = totalRequests > 0 ? (completedRequests / totalRequests * 100) : 0;
  
  // Business health score calculation
  const healthScore = Math.min(100, Math.max(0, 
    (totalRevenue > 0 ? 20 : 0) +
    (totalOrders > 0 ? 15 : 0) +
    (completionRate * 0.3) +
    (avgOrderValue > 500 ? 20 : avgOrderValue > 200 ? 10 : 5) +
    (totalRequests > 0 ? 15 : 0)
  ));

  // Header
  pdf.addHeader(
    'Executive Business Dashboard',
    `Comprehensive Analytics Report: ${formatters.date(startDate)} - ${formatters.date(endDate)}`,
    new Date()
  );

  // Business Health Overview
  pdf.addSection('Executive Summary');
  pdf.addBusinessHealthCard(
    Math.round(healthScore),
    'Based on revenue performance, order volume, service quality, and business activity metrics'
  );

  // KPI Grid
  const kpiMetrics = [
    {
      label: 'Total Revenue',
      value: formatters.currency(totalRevenue),
      trend: totalRevenue > 0 ? 'up' : 'neutral',
      change: totalRevenue > 0 ? '+' + formatters.currency(totalRevenue) : 'No activity'
    },
    {
      label: 'Total Orders',
      value: formatters.number(totalOrders),
      trend: totalOrders > 5 ? 'up' : totalOrders > 0 ? 'neutral' : 'down',
      change: `${totalOrders} orders`
    },
    {
      label: 'Avg Order Value',
      value: formatters.currency(avgOrderValue),
      trend: avgOrderValue > 750 ? 'up' : avgOrderValue > 500 ? 'neutral' : 'down',
      change: avgOrderValue > 0 ? formatters.currency(avgOrderValue) : 'N/A'
    },
    {
      label: 'Service Requests',
      value: formatters.number(totalRequests),
      trend: totalRequests > 0 ? 'up' : 'neutral',
      change: `${totalRequests} requests`
    },
    {
      label: 'Success Rate',
      value: formatters.percentage(completionRate),
      trend: completionRate > 70 ? 'up' : completionRate > 50 ? 'neutral' : 'down',
      change: formatters.percentage(completionRate)
    },
    {
      label: 'Business Activity',
      value: `${totalOrders + totalRequests}`,
      trend: (totalOrders + totalRequests) > 5 ? 'up' : 'neutral',
      change: 'transactions'
    }
  ];

  pdf.addKPIGrid(kpiMetrics);

  // Add visual charts section
  pdf.addPage();
  pdf.addSection('Performance Analytics & Trends');

  // Sales Performance Chart - Line Chart
  if (salesData.length > 0) {
    const salesChartData = salesData.map(item => ({
      label: formatters.date(item._id).split(' ').slice(0, 2).join(' '), // Shorter labels
      value: item.totalSales || 0,
      displayValue: formatters.currency(item.totalSales || 0)
    }));
    
    pdf.drawLineChart('Revenue Trend Analysis', salesChartData, {
      height: 180,
      formatValue: (value) => formatters.currency(value)
    });
  }

  // Orders vs Revenue - Bar Chart
  if (salesData.length > 0) {
    const ordersChartData = salesData.map(item => ({
      label: formatters.date(item._id).split(' ').slice(0, 2).join(' '),
      value: item.orderCount || 0,
      displayValue: formatters.number(item.orderCount || 0)
    }));
    
    pdf.drawBarChart('Daily Order Volume', ordersChartData, {
      height: 160,
      formatValue: (value) => formatters.number(value)
    });
  }

  // Service Requests Breakdown - Pie Chart
  if (data.requestsByServiceType?.length > 0) {
    const serviceChartData = data.requestsByServiceType.map(item => ({
      label: item._id,
      value: item.count,
      displayValue: formatters.number(item.count)
    }));
    
    pdf.drawPieChart('Service Type Distribution', serviceChartData, {
      size: 160
    });
  }

  // Revenue vs Time - Area Chart
  if (salesData.length > 1) {
    const areaChartData = salesData.map(item => ({
      label: formatters.date(item._id).split(' ').slice(1, 3).join(' '), // Month day
      value: item.totalSales || 0
    }));
    
    pdf.drawAreaChart('Revenue Growth Pattern', areaChartData, {
      height: 140,
      formatValue: (value) => formatters.currency(value)
    });
  }

  // Business Insights
  const insights = [
    {
      type: totalRevenue > 2000 ? 'success' : 'warning',
      text: totalRevenue > 2000 
        ? `Strong revenue performance of ${formatters.currency(totalRevenue)} indicates healthy business growth.`
        : totalRevenue > 0
        ? `Revenue of ${formatters.currency(totalRevenue)} shows early traction. Focus on scaling marketing efforts.`
        : 'No revenue generated in this period. Immediate attention needed for sales pipeline.'
    },
    {
      type: completionRate > 70 ? 'success' : 'warning',
      text: completionRate > 70
        ? `Excellent service completion rate of ${formatters.percentage(completionRate)} demonstrates operational efficiency.`
        : completionRate > 50
        ? `Service completion rate of ${formatters.percentage(completionRate)} needs improvement. Review processes.`
        : 'Low service completion rate requires immediate process optimization.'
    },
    {
      type: avgOrderValue > 750 ? 'success' : 'info',
      text: avgOrderValue > 750
        ? `High average order value of ${formatters.currency(avgOrderValue)} indicates premium customer engagement.`
        : avgOrderValue > 0
        ? `Average order value of ${formatters.currency(avgOrderValue)} suggests opportunities for upselling.`
        : 'Focus on increasing transaction value through product bundling and premium services.'
    }
  ];

  pdf.addSection('Strategic Business Insights');
  pdf.addInsightBox(insights);

  // Data Tables
  if (salesData.length > 0) {
    pdf.addPage();
    pdf.addSection('Business Performance Analysis');
    
    const salesTableData = salesData.map(item => [
      formatters.date(item._id),
      formatters.currency(item.totalSales || 0),
      formatters.number(item.orderCount || 0),
      formatters.currency(item.averageOrder || 0)
    ]);
    
    pdf.addDataTable(
      'Sales Performance Breakdown',
      ['Date', 'Revenue', 'Orders', 'Avg Order Value'],
      salesTableData,
      {
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'center' },
          3: { halign: 'right' }
        }
      }
    );
  }

  // Strategic Recommendations
  const recommendations = [
    {
      priority: 'high',
      title: 'Revenue Optimization',
      description: 'Focus on increasing average order value through product bundling, premium services, and strategic upselling initiatives.'
    },
    {
      priority: 'medium',
      title: 'Service Excellence',
      description: 'Implement process improvements to achieve 80%+ service completion rate and enhance customer satisfaction.'
    },
    {
      priority: 'medium',
      title: 'Market Expansion',
      description: 'Develop comprehensive marketing strategy to increase customer acquisition and market penetration.'
    },
    {
      priority: 'low',
      title: 'Data-Driven Growth',
      description: 'Continue monitoring these KPIs monthly to identify trends and optimize business performance systematically.'
    }
  ];

  pdf.addRecommendations(recommendations);

  // Save the PDF
  pdf.save(`Palani-Andavar-Executive-Dashboard-${formatters.date(startDate)}-to-${formatters.date(endDate)}.pdf`);
};

export const exportSalesPDF = (data, startDate, endDate) => {
  const pdf = new PDFTemplate();
  
  pdf.addHeader(
    'Sales Performance Report',
    `Analysis: ${formatters.date(startDate)} - ${formatters.date(endDate)}`,
    new Date()
  );

  // Sales metrics
  const salesData = data.salesData || [];
  const totalRevenue = salesData.reduce((sum, item) => sum + (item.totalSales || 0), 0);
  const totalOrders = salesData.reduce((sum, item) => sum + (item.orderCount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const kpiMetrics = [
    { label: 'Total Revenue', value: formatters.currency(totalRevenue), trend: 'up' },
    { label: 'Total Orders', value: formatters.number(totalOrders), trend: 'up' },
    { label: 'Avg Order Value', value: formatters.currency(avgOrderValue), trend: 'neutral' }
  ];

  pdf.addSection('Sales Overview');
  pdf.addKPIGrid(kpiMetrics);

  // Add visual charts for sales data
  if (salesData.length > 0) {
    // Revenue trend line chart
    const revenueChartData = salesData.map(item => ({
      label: formatters.date(item._id).split(' ').slice(0, 2).join(' '),
      value: item.totalSales || 0
    }));
    
    pdf.drawLineChart('Revenue Trend', revenueChartData, {
      height: 160,
      formatValue: (value) => formatters.currency(value)
    });

    // Orders bar chart
    const ordersChartData = salesData.map(item => ({
      label: formatters.date(item._id).split(' ').slice(0, 2).join(' '),
      value: item.orderCount || 0,
      displayValue: formatters.number(item.orderCount || 0)
    }));
    
    pdf.drawBarChart('Daily Orders', ordersChartData, {
      height: 140,
      formatValue: (value) => formatters.number(value)
    });

    // Data table
    const salesTableData = salesData.map(item => [
      formatters.date(item._id),
      formatters.currency(item.totalSales || 0),
      formatters.number(item.orderCount || 0),
      formatters.currency(item.averageOrder || 0)
    ]);

    pdf.addDataTable(
      'Daily Sales Performance',
      ['Date', 'Revenue', 'Orders', 'Avg Order'],
      salesTableData
    );
  }

  if (data.topProducts?.length > 0) {
    // Top products bar chart
    const topProductsChartData = data.topProducts.slice(0, 8).map(p => ({
      label: (p.product?.name || 'Unknown').substring(0, 15) + '...',
      value: p.revenue || 0,
      displayValue: formatters.currency(p.revenue || 0)
    }));

    pdf.drawBarChart('Top Products by Revenue', topProductsChartData, {
      height: 160,
      formatValue: (value) => formatters.currency(value)
    });

    const productsData = data.topProducts.map(p => [
      p.product?.name || 'Unknown',
      p.product?.category || 'N/A',
      formatters.number(p.totalSold || 0),
      formatters.currency(p.revenue || 0)
    ]);

    pdf.addDataTable(
      'Top Performing Products',
      ['Product', 'Category', 'Units Sold', 'Revenue'],
      productsData
    );
  }

  pdf.save(`Palani-Andavar-Sales-Report-${formatters.date(startDate)}-to-${formatters.date(endDate)}.pdf`);
};

export const exportServicesPDF = (data, startDate, endDate) => {
  const pdf = new PDFTemplate();
  
  pdf.addHeader(
    'Service Performance Report',
    `Analysis: ${formatters.date(startDate)} - ${formatters.date(endDate)}`,
    new Date()
  );

  const serviceRequests = data.requestsByStatus || [];
  const totalRequests = serviceRequests.reduce((sum, item) => sum + (item.count || 0), 0);
  const completedRequests = serviceRequests.find(s => s._id === 'Completed')?.count || 0;
  const completionRate = totalRequests > 0 ? (completedRequests / totalRequests * 100) : 0;

  const kpiMetrics = [
    { label: 'Total Requests', value: formatters.number(totalRequests), trend: 'up' },
    { label: 'Completed', value: formatters.number(completedRequests), trend: 'up' },
    { label: 'Success Rate', value: formatters.percentage(completionRate), trend: 'neutral' }
  ];

  pdf.addSection('Service Overview');
  pdf.addKPIGrid(kpiMetrics);

  // Add visual charts for service data
  if (data.requestsByStatus?.length > 0) {
    // Service status pie chart
    const statusChartData = data.requestsByStatus.map(item => ({
      label: item._id,
      value: item.count,
      displayValue: formatters.number(item.count)
    }));
    
    pdf.drawPieChart('Service Status Distribution', statusChartData, {
      size: 140
    });

    const statusData = data.requestsByStatus.map(r => [r._id, formatters.number(r.count)]);
    pdf.addDataTable('Requests by Status', ['Status', 'Count'], statusData);
  }

  if (data.requestsByServiceType?.length > 0) {
    // Service types bar chart
    const serviceTypeChartData = data.requestsByServiceType.map(item => ({
      label: item._id.substring(0, 15),
      value: item.count,
      displayValue: formatters.number(item.count)
    }));
    
    pdf.drawBarChart('Service Type Volume', serviceTypeChartData, {
      height: 160,
      formatValue: (value) => formatters.number(value)
    });

    const serviceData = data.requestsByServiceType.map(r => [r._id, formatters.number(r.count)]);
    pdf.addDataTable('Service Types', ['Service', 'Requests'], serviceData);
  }

  pdf.save(`Palani-Andavar-Services-Report-${formatters.date(startDate)}-to-${formatters.date(endDate)}.pdf`);
};

// Excel Export Functions
export const exportDashboardExcel = (data, startDate, endDate) => {
  const excel = new ExcelTemplate();
  excel.createDashboardSheet(data)
    .createSalesSheet(data)
    .createServicesSheet(data)
    .save(`Palani-Andavar-Executive-Dashboard-${formatters.date(startDate)}-to-${formatters.date(endDate)}.xlsx`);
};

export const exportSalesExcel = (data, startDate, endDate) => {
  const excel = new ExcelTemplate();
  excel.createSalesSheet(data)
    .save(`Palani-Andavar-Sales-Report-${formatters.date(startDate)}-to-${formatters.date(endDate)}.xlsx`);
};

export const exportServicesExcel = (data, startDate, endDate) => {
  const excel = new ExcelTemplate();
  excel.createServicesSheet(data)
    .save(`Palani-Andavar-Services-Report-${formatters.date(startDate)}-to-${formatters.date(endDate)}.xlsx`);
};
