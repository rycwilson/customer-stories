
class WidgetsController < ApplicationController

  skip_before_action :verify_authenticity_token, only: [:script, :data]
  before_action except: [:track] { @company = Company.find_by(subdomain: request.subdomain) }

  def script
    respond_to do |format|
      format.js { render action: 'cs' }
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
                { title: story.title,
                  logo: story.customer.logo_url,
                  path: story.published ? story.csp_story_url : stories_index_url,
                  published: story.published }
              end
    render_to_string(
      partial: params[:widget_format] == 'inline' ? 'more_stories_inline' : 'more_stories',
      layout: false,
      locals: { widget: @company.widget, stories: stories,
                title: 'Customer Stories', native: false }
    )
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






