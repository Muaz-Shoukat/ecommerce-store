"""Generate a printable PDF invoice for an order."""

from __future__ import annotations

from decimal import Decimal
from io import BytesIO

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import Order

BRAND = colors.HexColor("#19574c")
BRAND_SOFT = colors.HexColor("#eefbf8")
MUTED = colors.HexColor("#515f74")
INK = colors.HexColor("#1a1f2c")
LINE = colors.HexColor("#d5dae2")
ROW_ALT = colors.HexColor("#f7faf9")
WHITE = colors.white


def _money(value: Decimal | float | int) -> str:
    return f"{Decimal(value).quantize(Decimal('0.01')):,.2f}"


def _payment_status_label(order: Order) -> str:
    if order.payment_method == "stripe":
        return "Paid" if order.status != "pending" else "Awaiting payment"
    if order.payment_method == "cod":
        return "Pay on delivery"
    return order.get_status_display()


def build_invoice_pdf(order: Order) -> bytes:
    buffer = BytesIO()
    page_width = A4[0]
    side = 18 * mm
    content_width = page_width - (2 * side)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=side,
        rightMargin=side,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"Invoice #{order.pk}",
        author="Stationery Store",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Brand",
            fontName="Helvetica-Bold",
            fontSize=18,
            textColor=BRAND,
            leading=22,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Muted",
            fontName="Helvetica",
            fontSize=8.5,
            textColor=MUTED,
            leading=11,
        )
    )
    styles.add(
        ParagraphStyle(
            name="InvoiceTitle",
            fontName="Helvetica-Bold",
            fontSize=20,
            textColor=INK,
            alignment=TA_RIGHT,
            leading=24,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MetaRight",
            fontName="Helvetica",
            fontSize=9,
            textColor=INK,
            alignment=TA_RIGHT,
            leading=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Label",
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=BRAND,
            leading=10,
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=INK,
            leading=13,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Th",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=WHITE,
            leading=11,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ThRight",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=WHITE,
            alignment=TA_RIGHT,
            leading=11,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Td",
            fontName="Helvetica",
            fontSize=9,
            textColor=INK,
            leading=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TdCenter",
            fontName="Helvetica",
            fontSize=9,
            textColor=INK,
            alignment=TA_CENTER,
            leading=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TdRight",
            fontName="Helvetica",
            fontSize=9,
            textColor=INK,
            alignment=TA_RIGHT,
            leading=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=BRAND,
            spaceBefore=2,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Footer",
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            leading=11,
            alignment=TA_LEFT,
        )
    )

    created = timezone.localtime(order.created_at)
    customer_name = (order.guest_name or order.customer_display or "Guest").strip()
    email = order.customer_email()
    phone = (order.guest_phone or "").strip()
    address = (order.guest_address or "").strip()
    # Guest address may be stored as "Home: …" — show clean multi-line text.
    address_lines = [line.strip() for line in address.replace("Home:", "").split(",") if line.strip()]
    if not address_lines and address:
        address_lines = [address]

    story = []

    # --- Header (two columns, single-line cells — avoids nested-flowable overlap) ---
    left_header = [
        Paragraph("Stationery Store", styles["Brand"]),
        Paragraph("Premium kids stationery · Lahore", styles["Muted"]),
        Spacer(1, 2 * mm),
        Paragraph("12 School Lane, Lahore", styles["Muted"]),
        Paragraph("hello@stationerystore.example", styles["Muted"]),
    ]
    right_header = [
        Paragraph("INVOICE", styles["InvoiceTitle"]),
        Spacer(1, 2 * mm),
        Paragraph(f"<b>Order #{order.pk}</b>", styles["MetaRight"]),
        Paragraph(created.strftime("%d %b %Y · %I:%M %p"), styles["MetaRight"]),
        Paragraph(f"Status: {order.get_status_display()}", styles["MetaRight"]),
    ]
    header = Table(
        [[left_header, right_header]],
        colWidths=[content_width * 0.58, content_width * 0.42],
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(header)
    story.append(Spacer(1, 3 * mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=BRAND, spaceBefore=0, spaceAfter=6 * mm))

    # --- Bill to / Ship to ---
    bill_bits = [Paragraph("BILL TO", styles["Label"]), Paragraph(customer_name, styles["Body"])]
    if email:
        bill_bits.append(Paragraph(email, styles["Muted"]))
    if phone:
        bill_bits.append(Paragraph(phone, styles["Muted"]))

    ship_bits = [Paragraph("SHIP TO", styles["Label"]), Paragraph(customer_name, styles["Body"])]
    if address_lines:
        for line in address_lines:
            ship_bits.append(Paragraph(line, styles["Muted"]))
    else:
        ship_bits.append(Paragraph("Same as billing", styles["Muted"]))

    parties = Table(
        [[bill_bits, ship_bits]],
        colWidths=[content_width * 0.5, content_width * 0.5],
    )
    parties.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), BRAND_SOFT),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEAFTER", (0, 0), (0, 0), 0.4, LINE),
            ]
        )
    )
    story.append(parties)
    story.append(Spacer(1, 5 * mm))

    # --- Payment summary ---
    meta = Table(
        [
            [
                Paragraph("<b>Payment method</b>", styles["Td"]),
                Paragraph(order.get_payment_method_display(), styles["TdRight"]),
            ],
            [
                Paragraph("<b>Payment status</b>", styles["Td"]),
                Paragraph(_payment_status_label(order), styles["TdRight"]),
            ],
        ],
        colWidths=[content_width * 0.55, content_width * 0.45],
    )
    meta.setStyle(
        TableStyle(
            [
                ("LINEBELOW", (0, 0), (-1, 0), 0.4, LINE),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 2),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(meta)
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("ORDER ITEMS", styles["Section"]))

    # --- Line items ---
    col_item = content_width * 0.48
    col_qty = content_width * 0.12
    col_unit = content_width * 0.20
    col_amt = content_width * 0.20

    rows = [
        [
            Paragraph("#", styles["Th"]),
            Paragraph("Item", styles["Th"]),
            Paragraph("Qty", styles["ThRight"]),
            Paragraph("Unit (PKR)", styles["ThRight"]),
            Paragraph("Amount (PKR)", styles["ThRight"]),
        ]
    ]

    items = list(order.items.select_related("product", "variant").all())
    for idx, item in enumerate(items, start=1):
        name = item.product.name if item.product else "Item"
        if item.variant:
            name = f"{name} ({item.variant.name}: {item.variant.value})"
        unit = item.price_at_purchase
        line_total = (unit * item.quantity).quantize(Decimal("0.01"))
        rows.append(
            [
                Paragraph(str(idx), styles["TdCenter"]),
                Paragraph(name, styles["Td"]),
                Paragraph(str(item.quantity), styles["TdRight"]),
                Paragraph(_money(unit), styles["TdRight"]),
                Paragraph(_money(line_total), styles["TdRight"]),
            ]
        )

    items_table = Table(
        rows,
        colWidths=[content_width * 0.08, col_item, col_qty, col_unit, col_amt],
        repeatRows=1,
    )
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), BRAND),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for i in range(1, len(rows)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), ROW_ALT))
    items_table.setStyle(TableStyle(style_cmds))
    story.append(items_table)
    story.append(Spacer(1, 5 * mm))

    # --- Totals (right-aligned block) ---
    total = order.total_amount
    totals_inner = Table(
        [
            [
                Paragraph("Subtotal", styles["Td"]),
                Paragraph(f"PKR {_money(total)}", styles["TdRight"]),
            ],
            [
                Paragraph("<b>Total due</b>", styles["Td"]),
                Paragraph(f"<b>PKR {_money(total)}</b>", styles["TdRight"]),
            ],
        ],
        colWidths=[content_width * 0.28, content_width * 0.22],
    )
    totals_inner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 1), (-1, 1), BRAND_SOFT),
                ("BOX", (0, 1), (-1, 1), 0.8, BRAND),
                ("LINEBELOW", (0, 0), (-1, 0), 0.4, LINE),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    totals_wrap = Table(
        [[totals_inner]],
        colWidths=[content_width],
    )
    totals_wrap.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(totals_wrap)
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LINE, spaceBefore=0, spaceAfter=4 * mm))
    story.append(
        Paragraph(
            "Thank you for shopping with Stationery Store. "
            "This invoice is for your records. "
            "Questions? Reply to your confirmation email or contact the store.",
            styles["Footer"],
        )
    )

    doc.build(story)
    return buffer.getvalue()
