import { jsPDF } from 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    GState(config: { opacity?: number }): any;
    setGState(gstate: any): jsPDF;
    addGState(label: string, gstate: any): jsPDF;
    saveGraphicsState(): jsPDF;
    restoreGraphicsState(): jsPDF;
  }
}

