import os
import textwrap
from PIL import Image, ImageDraw, ImageFont

# Configuration
ASSET_DIR = "marketing/spark_100_campaign/assets"
LOGO_PATH = "public/logo-transparent-v2.png"

# Text Mappings (Base Name -> Text)
ASSETS = {
    "co_creation_hero": "Build Together. Join as a Founding Family.",
    "future_impact_hero": "Engineering Her Future with STEAM Spark.",
    "curiosity_science_hero": "Igniting the Spark of Curiosity.",
    "family_pride_hero": "See Their Progress. Share Their Pride."
}

def generate_assets():
    if not os.path.exists(LOGO_PATH):
        print(f"Error: Logo not found at {LOGO_PATH}")
        return

    # Load Logo
    logo = Image.open(LOGO_PATH).convert("RGBA")
    
    for base_name, text in ASSETS.items():
        input_filename = f"{base_name}_raw.png"
        output_filename = f"{base_name}.png"
        
        image_path = os.path.join(ASSET_DIR, input_filename)
        output_path = os.path.join(ASSET_DIR, output_filename)
        
        if not os.path.exists(image_path):
            print(f"Skipping missing asset: {input_filename}")
            continue

        print(f"Processing {base_name}...")
        
        # Open Base Reference Image (Raw)
        base_img = Image.open(image_path).convert("RGBA")
        width, height = base_img.size

        # Responsive Values
        font_size = int(width / 22) # Scale text relative to image width
        margin_x = int(width * 0.05) # 5% margin
        margin_bottom = int(height * 0.08) # 8% bottom margin
        
        # Load Font
        try:
            # Mac OS Bold Font
            font_path = "/System/Library/Fonts/HelveticaNeue.ttc"
            font = ImageFont.truetype(font_path, font_size, index=1)
        except:
            try:
                font = ImageFont.truetype("Arial", font_size)
            except:
                font = ImageFont.load_default()
                print("Warning: collaborative font not found, using default.")

        # Text Wrapping
        # Estimate characters per line: width * 0.6 (max text width factor) / (font_size * 0.5 avg char width)
        max_text_width = width * 0.7 
        avg_char_width = font_size * 0.5
        chars_per_line = int(max_text_width / avg_char_width)
        
        wrapped_text = textwrap.fill(text, width=chars_per_line)

        # Calculate Text Height
        dummy_draw = ImageDraw.Draw(base_img)
        bbox = dummy_draw.textbbox((0, 0), wrapped_text, font=font)
        text_h = bbox[3] - bbox[1]

        # Calculate Text Position
        text_x = margin_x
        text_y = height - text_h - margin_bottom

        # Create Overlay for Text (Gradient)
        overlay = Image.new("RGBA", base_img.size, (0,0,0,0))
        draw = ImageDraw.Draw(overlay)
        
        # Dynamic gradient height based on text
        gradient_height = int(text_h + margin_bottom + (height * 0.1))
        
        for y in range(height - gradient_height, height):
            # Non-linear alpha for smoother fade
            progress = (y - (height - gradient_height)) / gradient_height
            alpha = int(220 * (progress ** 0.5)) # Fade in quickly then hold
            draw.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))

        # Compose Base + Overlay
        out_img = Image.alpha_composite(base_img, overlay)
        draw_ctx = ImageDraw.Draw(out_img)

        # Draw Text with Shadow
        shadow_offset = int(font_size * 0.05)
        draw_ctx.text((text_x + shadow_offset, text_y + shadow_offset), wrapped_text, font=font, fill=(0, 0, 0, 180))
        draw_ctx.text((text_x, text_y), wrapped_text, font=font, fill=(255, 255, 255, 255))

        # Draw Logo (Top Right)
        # Resize logo to 20% of width
        logo_target_width = int(width * 0.2)
        logo_ratio = logo.height / logo.width
        logo_target_height = int(logo_target_width * logo_ratio)
        
        resized_logo = logo.resize((logo_target_width, logo_target_height), Image.Resampling.LANCZOS)
        
        # Position: Top Right with padding
        logo_padding = int(width * 0.04)
        logo_x = width - int(logo_target_width) - logo_padding
        logo_y = logo_padding
        out_img.paste(resized_logo, (logo_x, logo_y), resized_logo)

        # Save as main filename (overwriting previous attempt)
        out_img.save(output_path)
        print(f"Saved {output_filename}")

if __name__ == "__main__":
    generate_assets()
