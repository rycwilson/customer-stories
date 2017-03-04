
class WidgetsController < ApplicationController

  skip_before_action :verify_authenticity_token, only: [:script, :data]
  before_action except: [:track] { @company = Company.find_by(subdomain: request.subdomain) }

  def script
    respond_to do |format|
      format.js { render action: 'cs' }
      # format.html - might use this at some point
    end
  end

  def data
    respond_to do |format|
      format.js do
        # Build a JSON object containing our HTML
        json = { html: widget_html(params) }.to_json
        # Get the name of the JSONP callback created by jQuery
        callback = params[:callback]
        # Wrap the JSON object with a call to the JSONP callback
        jsonp = callback + "(" + json + ")"
        # Send result to the browser
        render text: jsonp
      end
    end
  end

  def track
    response.headers.delete('X-Frame-Options')
    render layout: false
  end

  private

  # if invalid category or product filters, return all stories
  def widget_html params
    tab_options = params[:tab_options]
    # TODO: allow for both category and product filters
    filter_attributes = params[:category].present? ?
                            { tag: 'category', slug: params[:category] } :
                        (params[:product].present? ?
                            { tag: 'product', slug: params[:product] } : nil)
    filter_params = filter_attributes ?
        validate_and_convert_filter_attributes(filter_attributes, @company) : nil
    stories_index_url = filter_params ?
        root_url(host: request.subdomain + '.' + request.domain) +
                  '?' + filter_params[:tag] + '=' + filter_attributes[:slug] :
        root_url(host: request.subdomain + '.' + request.domain)
    stories =
      @company.filter_stories_by_tag(filter_params || { tag: 'all', id: '0' }, false)
              .map do |story|
                { logo: story.customer.logo_url,
                  url: story.published ? story.csp_story_url : stories_index_url }
              end

    html = "<section class='cs-drawer' style='visibility:hidden'>
              <header class='text-center'
                style='#{@company.widget_config.tab_style(tab_options, false)}'>
                Customer Stories&nbsp;
                <i class='fa fa-chevron-up'></i><i class='fa fa-chevron-down' style='display:none'></i>
              </header>
              <div class='cs-drawer-content' style='border-top-color:#{tab_options[:tab_color] || @company.widget_config.tab_color}'>
                <div class='cs-drawer-items'>
                  <div class='cs-scroll-left'></div>
                    <div class='cs-row cs-pagination-row text-center'>
                    </div>
                    <div class='cs-row row-horizon text-center'>"

    xs_col_width = 4
    sm_col_width = 3
    md_col_width = 2

    # the bootstrap styling starts to break down after 30 stories
    stories.first(30).each do |story|
      html <<         "<div class='col-xs-#{xs_col_width} col-sm-#{sm_col_width} col-md-#{md_col_width}'>
                         <a href='#{story[:url]}' class='cs-thumbnail' target='_blank'>
                           <img src='#{story[:logo]}' alt=''>
                         </a>
                       </div>"
    end

    html <<        "</div>
                  <div class='cs-scroll-right'></div>
                </div>
              </div>
            </section>"
  end

  # filter attributes = { tag: ... , slug: ... }
  def validate_and_convert_filter_attributes filter_attributes, company
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






