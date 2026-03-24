import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"

interface InvoiceData {
    invoiceNumber: string
    date: Date
    parentName: string
    parentEmail: string
    studentName: string
    teacherName: string
    courseTitle: string
    subject: string
    totalSessions: number
    pricePerSession: number
    totalAmount: number
    startDate: string
    preferredDays: string[]
    preferredTime: string
    location?: string
}

export async function generateInvoice(data: InvoiceData) {
    const doc = new jsPDF() as any

    // Colors
    const primaryColor = [79, 70, 229] // Indigo-600

    // Header / Branding
    doc.setFillColor(249, 250, 251)
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setFontSize(24)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFont("helvetica", "bold")
    doc.text("STEAM SPARK", 20, 25)
    
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.setFont("helvetica", "normal")
    doc.text("Igniting Curiosity through STEAM", 20, 32)

    doc.setFontSize(18)
    doc.setTextColor(31, 41, 55)
    doc.text("INVOICE", 150, 25)
    doc.setFontSize(10)
    doc.text(`#${data.invoiceNumber}`, 150, 32)

    // Parent & Student Info
    doc.setFontSize(12)
    doc.setTextColor(31, 41, 55)
    doc.setFont("helvetica", "bold")
    doc.text("Bill To:", 20, 55)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(data.parentName, 20, 62)
    doc.text(data.parentEmail, 20, 67)
    doc.text(`Student: ${data.studentName}`, 20, 72)

    // Schedule Info
    doc.setFont("helvetica", "bold")
    doc.text("Booking Details:", 120, 55)
    doc.setFont("helvetica", "normal")
    doc.text(`Date: ${format(data.date, 'PPP')}`, 120, 62)
    doc.text(`Teacher: ${data.teacherName}`, 120, 67)
    doc.text(`Start Date: ${data.startDate}`, 120, 72)
    doc.text(`Schedule: ${data.preferredDays.join(', ')} @ ${data.preferredTime}`, 120, 77)

    // Table
    const tableData = [
        [
            data.courseTitle,
            data.totalSessions.toString(),
            `GHS ${data.pricePerSession.toLocaleString()}`,
            `GHS ${data.totalAmount.toLocaleString()}`
        ]
    ]

    doc.autoTable({
        startY: 90,
        head: [['Course Description', 'Sessions', 'Price/Session', 'Total']],
        body: tableData,
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' }
        }
    })

    const finalY = (doc as any).lastAutoTable.cursor.y

    // Totals
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Subtotal:", 140, finalY + 15)
    doc.text(`GHS ${data.totalAmount.toLocaleString()}`, 180, finalY + 15, { align: 'right' })
    
    doc.setFontSize(12)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text("Total Amount Due:", 140, finalY + 25)
    doc.text(`GHS ${data.totalAmount.toLocaleString()}`, 180, finalY + 25, { align: 'right' })

    // Footer / Notes
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.setFont("helvetica", "bold")
    doc.text("Payment Notes:", 20, finalY + 45)
    doc.setFont("helvetica", "normal")
    doc.text("Please complete payment within 48 hours to secure your booking.", 20, finalY + 52)
    doc.text("Payments should be made via the STEAM Spark portal or bank transfer.", 20, finalY + 57)

    if (data.location) {
        doc.setFont("helvetica", "bold")
        doc.text("Location:", 20, finalY + 67)
        doc.setFont("helvetica", "normal")
        doc.text(data.location, 20, finalY + 74)
    }

    doc.setFontSize(8)
    doc.text("Thank you for choosing STEAM Spark!", 105, 285, { align: 'center' })

    // Save
    doc.save(`Invoice_${data.invoiceNumber}.pdf`)
}

export async function generateBookingConfirmation(data: InvoiceData) {
    // Similar to invoice but more focused on the student's journey and welcome
    const doc = new jsPDF() as any
    const primaryColor = [16, 185, 129] // Emerald-500 for confirmation

    doc.setFillColor( primaryColor[0], primaryColor[1], primaryColor[2] )
    doc.rect(0, 0, 210, 60, 'F')
    
    doc.setFontSize(28)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("CONGRATULATIONS!", 105, 30, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text("Your STEAM Journey Begins Now", 105, 45, { align: 'center' })

    doc.setTextColor(31, 41, 55)
    doc.setFontSize(16)
    doc.text(`Welcome to ${data.courseTitle}, ${data.studentName}!`, 20, 80)

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    const welcomeText = `We are thrilled to embark on this learning adventure with you. Your teacher, ${data.teacherName}, is preparing a curriculum designed to ignite your curiosity and build your skills in ${data.subject}.`
    doc.text(doc.splitTextToSize(welcomeText, 170), 20, 95)

    // Schedule Card
    doc.setDrawColor(229, 231, 235)
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(20, 110, 170, 50, 3, 3, 'FD')
    
    doc.setFont("helvetica", "bold")
    doc.text("Class Schedule", 30, 120)
    doc.setFont("helvetica", "normal")
    doc.text(`• Total Sessions: ${data.totalSessions}`, 30, 130)
    doc.text(`• Start Date: ${data.startDate}`, 30, 137)
    doc.text(`• Meeting Days: ${data.preferredDays.join(', ')}`, 30, 144)
    doc.text(`• Class Time: ${data.preferredTime}`, 30, 151)

    // Next Steps
    doc.setFont("helvetica", "bold")
    doc.text("What happens next?", 20, 180)
    doc.setFont("helvetica", "normal")
    const steps = [
        "1. Your teacher will reach out to introduce themselves.",
        "2. You'll receive a meeting link (if online) or confirm location details (if in-person).",
        "3. Get your materials ready for your first session!",
        "4. Track your progress in the STEAM Spark Parent Portal."
    ]
    steps.forEach((step, i) => {
        doc.text(step, 20, 195 + (i * 10))
    })

    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text("STEAM Spark - Empowering the next generation of innovators.", 105, 285, { align: 'center' })

    doc.save(`Confirmation_${data.studentName.replace(' ', '_')}.pdf`)
}
