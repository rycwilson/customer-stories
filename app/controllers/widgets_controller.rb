class WidgetsController < ApplicationController

  skip_before_action :verify_authenticity_token, only: [:script, :data]

  def script
    respond_to do |format|
      format.js { render action: 'cs' }
      # format.html - might use this at some point
    end
  end

  def data
    html = widget_html params
    respond_to do |format|
      format.js do
        # Build a JSON object containing our HTML
        json = { html: html }.to_json
        # Get the name of the JSONP callback created by jQuery
        callback = params[:callback]
        # Wrap the JSON object with a call to the JSONP callback
        jsonp = callback + "(" + json + ")"
        # Send result to the browser
        render text: jsonp
      end
    end
  end

  protected

  # if invalid category or product filters, return all stories
  def widget_html params
    company_subdomain = request.subdomain
    tab_color = params[:tabColor]
    font_color = params[:fontColor]
    filter_all = { tag: 'all', id: '0' }
    filter_attributes = params[:category].present? ?
                            { tag: 'category', slug: params[:category] } :
                        (params[:product].present? ?
                            { tag: 'product', slug: params[:product] } : nil)
    filter_params = filter_attributes ?
        validate_and_convert_filter_attributes(filter_attributes) : nil
    stories_index_url = filter_params ?
        csp_stories_url(host: company_subdomain + '.' + request.domain) +
              '?' + filter_params[:tag] + '=' + filter_attributes[:slug] :
        csp_stories_url(host: company_subdomain + '.' + request.domain)
    stories_links =
         Company.find_by(subdomain: company_subdomain)
                .filter_stories_by_tag(filter_params || filter_all, false)
                .map do |success|
                  story = success.story
                  { logo: success.customer.logo_url,
                    link: story.published ?
                            URI.join(root_url(host: company_subdomain + '.' + request.domain),
                                     story.csp_story_path).to_s
                            : stories_index_url }
                end

    html = "<section class='drawer' style='visibility:hidden'>
              <header class='clickme'
                style='background-color:#{tab_color};color:#{font_color}'>
                Customer Stories
              </header>
              <div class='drawer-content' style='border-top-color:#{tab_color}'>
                <div class='drawer-items'>
                  <div class='scroll-left'></div>
                    <div class='row row-pagination text-center'>
                    </div>
                    <div class='row row-horizon text-center'>"

    # determine best column width given number of stories
    case stories_links.length
      when 1..10
        xs_col_width = 4
        sm_col_width = 3
        md_col_width = 2
      when 11..30
        xs_col_width = 4
        sm_col_width = 3
        md_col_width = 2
    end

    # the bootstrap styling starts to break down after 30 stories
    stories_links.first(30).each do |story|
      html <<         "<div class='col-xs-#{xs_col_width} col-sm-#{sm_col_width} col-md-#{md_col_width}'>
                         <a href='#{story[:link]}' class='thumbnail' target='_blank'>
                           <img src='#{story[:logo]}' alt=''>
                         </a>
                       </div>"
    end

    html <<        "</div>
                  <div class='scroll-right'></div>
                </div>
              </div>
            </section>"
  end

  # filter attributes = { tag: ... , slug: ... }
  def validate_and_convert_filter_attributes filter_attributes
    company = Company.find_by subdomain: request.subdomain
    case filter_attributes[:tag]
      when 'category'
        category_id = StoryCategory.joins(successes: { customer: {} })
                                   .where(slug: filter_attributes[:slug],
                                          customers: { company_id: company.id } )
                                   .take.try(:id)
        return category_id ? { tag: 'category', id:  category_id } : nil
      when 'product'
        product_id = Product.joins(successes: { customer: {} })
                            .where(slug: filter_attributes[:slug],
                                   customers: { company_id: company.id } )
                            .take.try(:id)
        return product_id ? { tag: 'product', id: product_id } : nil
    end
  end

end






