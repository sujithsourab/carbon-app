import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { ProjectInfo, GeneratedDocument, DocumentSection } from '../types';

export const generateDocx = async (projectInfo: ProjectInfo, generatedDocument: GeneratedDocument): Promise<void> => {
  // Create document sections from the generated content
  const docSections = [];

  // Add title page
  docSections.push(
    new Paragraph({
      text: "VCS PROJECT DESCRIPTION",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
        before: 400
      }
    }),
    new Paragraph({
      text: projectInfo.name,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 200
      }
    }),
    new Paragraph({
      text: `${projectInfo.projectType} Project in ${projectInfo.location}`,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400
      }
    }),
    new Paragraph({
      text: `Start Date: ${new Date(projectInfo.startDate).toLocaleDateString()}`,
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({
      text: `Methodology: ${projectInfo.methodology}`,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 800
      }
    }),
    new Paragraph({
      text: "Prepared by: Carbon Project Documentation Generator",
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 200
      }
    }),
    new Paragraph({
      text: new Date().toLocaleDateString(),
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 800
      }
    }),
    new Paragraph({
      text: "",
      break: 1
    })
  );

  // Add project summary table
  const summaryTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Project Name")],
            shading: {
              fill: "F2F2F2",
            },
          }),
          new TableCell({
            children: [new Paragraph(projectInfo.name)],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Project Type")],
            shading: {
              fill: "F2F2F2",
            },
          }),
          new TableCell({
            children: [new Paragraph(projectInfo.projectType)],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Location")],
            shading: {
              fill: "F2F2F2",
            },
          }),
          new TableCell({
            children: [new Paragraph(projectInfo.location)],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Start Date")],
            shading: {
              fill: "F2F2F2",
            },
          }),
          new TableCell({
            children: [new Paragraph(new Date(projectInfo.startDate).toLocaleDateString())],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Methodology")],
            shading: {
              fill: "F2F2F2",
            },
          }),
          new TableCell({
            children: [new Paragraph(projectInfo.methodology)],
          }),
        ],
      }),
    ],
  });

  docSections.push(summaryTable);
  
  // Add page break after summary
  docSections.push(
    new Paragraph({
      text: "",
      break: 1
    })
  );

  // Process each section from the generated document
  generatedDocument.sections.forEach(section => {
    // Add section heading
    docSections.push(
      new Paragraph({
        text: `${section.id} ${section.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: {
          after: 200,
          before: 400
        }
      })
    );

    // Add section content
    if (section.content) {
      const paragraphs = section.content.split('\n').filter(p => p.trim() !== '');
      paragraphs.forEach(paragraph => {
        docSections.push(
          new Paragraph({
            text: paragraph,
            spacing: {
              after: 120
            }
          })
        );
      });
    }

    // Process subsections
    if (section.subsections && section.subsections.length > 0) {
      processSubsections(section.subsections, docSections);
    }
  });

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docSections
      }
    ]
  });

  // Generate and save the document
  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `${projectInfo.name.replace(/[^a-z0-9]/gi, '_')}_Project_Description.docx`);
};

// Helper function to process subsections recursively
const processSubsections = (subsections: DocumentSection[], docSections: any[]) => {
  subsections.forEach(subsection => {
    // Determine heading level based on subsection ID depth
    const idParts = subsection.id.split('.');
    const headingLevel = Math.min(idParts.length + 1, 6) as HeadingLevel;
    
    docSections.push(
      new Paragraph({
        text: `${subsection.id} ${subsection.title}`,
        heading: headingLevel,
        spacing: {
          after: 200,
          before: 300
        }
      })
    );

    // Add subsection content
    if (subsection.content) {
      const paragraphs = subsection.content.split('\n').filter(p => p.trim() !== '');
      paragraphs.forEach(paragraph => {
        docSections.push(
          new Paragraph({
            text: paragraph,
            spacing: {
              after: 120
            }
          })
        );
      });
    }

    // Process nested subsections
    if (subsection.subsections && subsection.subsections.length > 0) {
      processSubsections(subsection.subsections, docSections);
    }
  });
};