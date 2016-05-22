class WidgetsController < ApplicationController

  skip_before_action :verify_authenticity_token, only: [:script, :data]

  def script
    respond_to do |format|
      format.js { render action: 'cs' }
      # format.html - might use this at some point
    end
  end

  def data
    html = widget_html params[:company]
    respond_to do |format|
      format.js do
        # Build a JSON object containing our HTML
        json = { html: html }.to_json
        # Get the name of the JSONP callback created by jQuery
        callback = params[:callback]
        # Wrap the JSON object with a call to the JSONP callback
        jsonp = callback + "(" + json + ")"
        # Send result to the browser
        render text: jsonp, content_type: "text/javascript"
      end
    end
  end

  protected

  def widget_html company_subdomain
    storiesLink = stories_url(host: company_subdomain + '.' + request.domain)
    company = Company.find_by(subdomain: company_subdomain)
    logoLinks = company.successes_with_logo_published
                       .map { |success| success.customer.logo_url }

    html = "<section class='drawer'>
              <header class='clickme'>Customer Success Stories</header>
              <div class='drawer-content'>
                <div class='drawer-items'>
                  <div class='row row-horizon'>"

    logoLinks.each do |logoLink|
      html <<       "<div class='col-xs-4 col-sm-3 col-md-2'>
                       <a href='#{storiesLink}' class='thumbnail' target='_blank'>
                         <img src='#{logoLink}' alt=''>
                       </a>
                     </div>"
    end

    html <<      "</div>
                </div>
              </div>
            </section>"
  end

end