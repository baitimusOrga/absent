import {auth} from './auth';

auth;


export type PdfStatus = {
	available: boolean;
	message: string;
};

export const pdfService = {
	async getStatus(): Promise<PdfStatus> {
		return {
			available: false,
			message: 'PDF generation service not implemented yet.',
		};
	},
};

