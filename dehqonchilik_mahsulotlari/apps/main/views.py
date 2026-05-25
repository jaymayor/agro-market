from django.shortcuts import render
from django.views.generic import TemplateView


class FrontendView(TemplateView):
    """Serve frontend HTML files"""
    template_name = 'index.html'


def index_view(request):
    """Serve the main index page"""
    return render(request, 'index.html')
