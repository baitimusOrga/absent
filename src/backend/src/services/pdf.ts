import {auth} from './auth';

auth;


import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import type { PdfFillData, PdfTemplate, School } from '../types/pdf.types';

export type PdfStatus = {
	available: boolean;
	message: string;
};

/**
 * Registry of PDF templates by school
 */
const PDF_TEMPLATES: Record<School, PdfTemplate> = {
	BBZW: {
		school: 'BBZW',
		filePath: 'Entschuldigung_Urlaubsgesuch_BBZW.pdf',
		maxLessonRows: 7,
		fieldMapping: {
			studentName: 'Name und Vorname Lernender',
			geburtsdatum: 'Geburtsdatum',
			klasse: 'Klasse',
			datumDerAbsenz: 'Datum der Absenz',
			begruendung: 'Begründung der Absenzen Beim Urlaubsgesuch Beweismittel zwingend beilegen',
			entschuldigungCheckbox: 'undefined',
			urlaubsgesuchCheckbox: 'undefined_2',
			berufsbildnerEmail: 'E-Mailadresse Berufsbildner/in',
			berufsbildnerNameUndTelefon: 'Name und Telefonnummer Berufsbildnerin',
			lessonRows: {
				anzahlLektionen: 'Anzahl LektionenRow{row}',
				wochentagUndDatum: 'Wochentag und Da tumRow{row}',
				fach: 'FachRow{row}',
				lehrperson: 'LehrpersonRow{row}',
			},
		},
	},
	BBZG: {
		school: 'BBZG',
		filePath: 'Entschuldigungs_Urlaubsgesuch_BBZG.pdf',
		maxLessonRows: 7,
		fieldMapping: {
			studentName: 'Name und Vorname Lernender',
			geburtsdatum: 'Geburtsdatum',
			klasse: 'Klasse',
			datumDerAbsenz: 'Datum der Absenz',
			begruendung: 'Begründung der Absenzen Beim Urlaubsgesuch Beweismittel beilegen',
			entschuldigungCheckbox: 'Entschuldigung',
			urlaubsgesuchCheckbox: 'Urlaubgsgesuch',
			berufsbildnerNameUndTelefon: 'Name und Telefonnummer Berufsbildnerin',
			datumUnterschrift: 'Datum Unterschrift Berufsbildnerin',
			bemerkung: 'Bemerkung',
			lessonRows: {
				anzahlLektionen: 'Anzahl LektionenRow{row}',
				wochentagUndDatum: 'Wochentag und DatumRow{row}',
				fach: 'FachRow{row}',
				lehrperson: 'LehrpersonRow{row}',
			},
		},
	},
};

/**
 * Get the appropriate PDF template configuration
 */
function getTemplate(school: School): PdfTemplate {
	const template = PDF_TEMPLATES[school];
	if (!template) {
		throw new Error(`No PDF template found for school: ${school}`);
	}
	return template;
}

/**
 * Fill a PDF form with the provided data
 */
async function fillPdf(data: PdfFillData, userData?: any): Promise<Buffer> {
	const template = getTemplate(data.school);
	const pdfPath = path.join(__dirname, '../../pdfs', template.filePath);
	
	if (!fs.existsSync(pdfPath)) {
		throw new Error(`PDF template not found: ${pdfPath}`);
	}
	
	const pdfBuffer = fs.readFileSync(pdfPath);
	const pdfDoc = await PDFDocument.load(pdfBuffer);
	const form = pdfDoc.getForm();
	
	// Fill basic fields
	const { fieldMapping } = template;
	
	try {
		// Use user data from MongoDB to auto-fill fields
		const studentName = userData?.fullname || '';
		const school = data.school || userData?.school || '';
		const berufsbildnerName = userData?.berufsbildner || '';
		const berufsbildnerEmail = userData?.berufsbildnerEmail || '';
		
		// Format dateOfBirth as string if it's a Date object
		let dateOfBirth = '';
		if (userData?.dateOfBirth) {
			if (userData.dateOfBirth instanceof Date) {
				dateOfBirth = userData.dateOfBirth.toISOString().split('T')[0];
			} else if (typeof userData.dateOfBirth === 'string') {
				dateOfBirth = userData.dateOfBirth;
			}
		}
		
		form.getTextField(fieldMapping.studentName).setText(studentName);
		form.getTextField(fieldMapping.geburtsdatum).setText(dateOfBirth || data.geburtsdatum || '');
		form.getTextField(fieldMapping.klasse).setText(data.klasse || '');
		form.getTextField(fieldMapping.datumDerAbsenz).setText(data.datumDerAbsenz || '');
		form.getTextField(fieldMapping.begruendung).setText(data.begruendung || '');
		
		// Check appropriate checkbox for form type
		if (data.formType === 'Entschuldigung' && fieldMapping.entschuldigungCheckbox) {
			form.getCheckBox(fieldMapping.entschuldigungCheckbox).check();
		} else if (data.formType === 'Urlaubsgesuch' && fieldMapping.urlaubsgesuchCheckbox) {
			form.getCheckBox(fieldMapping.urlaubsgesuchCheckbox).check();
		}
		
		// Fill optional fields with user data from MongoDB
		if (berufsbildnerName && fieldMapping.berufsbildnerNameUndTelefon) {
			form.getTextField(fieldMapping.berufsbildnerNameUndTelefon).setText(berufsbildnerName);
		}
		if (berufsbildnerEmail && fieldMapping.berufsbildnerEmail) {
			form.getTextField(fieldMapping.berufsbildnerEmail).setText(berufsbildnerEmail);
		}
		if (data.datumUnterschrift && fieldMapping.datumUnterschrift) {
			form.getTextField(fieldMapping.datumUnterschrift).setText(data.datumUnterschrift);
		}
		if (data.bemerkung && fieldMapping.bemerkung) {
			form.getTextField(fieldMapping.bemerkung).setText(data.bemerkung);
		}
		
		// Fill lesson rows
		const maxRows = Math.min(data.missedLessons.length, template.maxLessonRows);
		for (let i = 0; i < maxRows; i++) {
			const lesson = data.missedLessons[i];
			const rowNum = i + 1;
			
			const anzahlField = fieldMapping.lessonRows.anzahlLektionen.replace('{row}', rowNum.toString());
			const datumField = fieldMapping.lessonRows.wochentagUndDatum.replace('{row}', rowNum.toString());
			const fachField = fieldMapping.lessonRows.fach.replace('{row}', rowNum.toString());
			const lehrpersonField = fieldMapping.lessonRows.lehrperson.replace('{row}', rowNum.toString());
			
			try {
				form.getTextField(anzahlField).setText(lesson.anzahlLektionen);
				form.getTextField(datumField).setText(lesson.wochentagUndDatum);
				form.getTextField(fachField).setText(lesson.fach);
				form.getTextField(lehrpersonField).setText(lesson.lehrperson);
			} catch (err) {
				console.warn(`Could not fill lesson row ${rowNum}:`, err);
			}
		}
		
		// Flatten form to prevent further editing
		form.flatten();
		
		const pdfBytes = await pdfDoc.save();
		return Buffer.from(pdfBytes);
	} catch (error) {
		console.error('Error filling PDF:', error);
		throw new Error(`Failed to fill PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

export const pdfService = {
	async getStatus(): Promise<PdfStatus> {
		return {
			available: true,
			message: 'PDF generation service is ready.',
		};
	},
	
	/**
	 * Fill a PDF form with provided data
	 * @param data - Form data to fill
	 * @param userData - Optional user data from MongoDB to prefill fields
	 */
	async fillPdf(data: PdfFillData, userData?: any): Promise<Buffer> {
		return fillPdf(data, userData);
	},
	
	/**
	 * Get list of available templates
	 */
	getAvailableTemplates(): School[] {
		return Object.keys(PDF_TEMPLATES) as School[];
	},
};

