
class WidgetsController < ApplicationController

  skip_before_action :verify_authenticity_token, only: [:script, :html]
  before_action except: [:track] { @company = Company.find_by(subdomain: request.subdomain) }

  def script
    @type = params[:type] || 'tab'
    respond_to do |format|
      format.js { render action: 'cs' }
    end
  end

  def html
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
    stories =
      @company.filter_stories_by_tag(filter_params || { tag: 'all', id: '0' }, false)
              .map do |story|
                if story.published?
                  target_url = story.csp_story_url
                elsif story.preview_published?
                  target_url = root_url(subdomain: @company.subdomain) + "?preview=#{story.slug}"
                elsif story.logo_published?
                  target_url = 'javascript:;'
                end
                {
                  title: story.title,
                  customer: story.customer.name,
                  logo: story.customer.logo_url,
                  url: target_url,
                  published: story.published?,
                  preview_published: story.preview_published?,
                  updated_at: story.updated_at
                }
              end
    if @company.subdomain == 'varmour'
      # ref: https://stackoverflow.com/questions/33732208
      stories = stories.sort_by { |s| [ !s[:published] ? 0 : 1, s[:updated_at] ] }.reverse
    end
    case params[:type]
    when 'tab'
      partial = 'more_stories_tab'
    when 'rel'
      partial = 'more_stories_rel'
    when 'rel-exp'
      partial = 'more_stories_rel_exp'
    when 'varmour'
      partial = 'more_stories_varmour'
    end
    render_to_string(
      partial: partial,
      layout: false,
      locals: {
        company: @company, widget: @company.widget, stories: stories,
        title: 'Customer Stories', native: false
      }
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






