from flask import Blueprint, render_template

info_bp = Blueprint('info', __name__)

@info_bp.route('/artists')
def artists_showcase():
    # In a real app, you'd fetch artists from the DB here.
    # For now, we render the template.
    return render_template('info/artists.html')

@info_bp.route('/guide/artists')
def artist_guide():
    return render_template('info/guide_artists.html')

@info_bp.route('/guide/customers')
def customer_guide():
    return render_template('info/guide_customers.html')

@info_bp.route('/about')
def about_us():
    return render_template('info/about_us.html')

@info_bp.route('/inspiration')
def inspiration():
    return render_template('info/inspiration.html')

@info_bp.route('/art-advisory')
def art_advisory():
    return render_template('info/art_advisory.html')