# frozen_string_literal: true

class VisitorsController < ApplicationController
  def index
    set_company
    set_curator
    set_visitors_filters
    Time.zone = params[:time_zone] || 'UTC'

    if is_demo?
      @company = Company.find_by_subdomain 'varmour'
      curator = User.find_by_email 'kturner@varmour.com'
      story = @visitors_filters['story'] && @company.stories.published.sample
      today = Date.today.change(year: 2018)
    else
      curator = @curator
      today = Date.today
    end

    start_date, end_date = set_date_range(today)

    by_date =
      Visitor.to_company_by_date(
        @company.id,
        curator_id: curator&.id,
        start_date:,
        end_date:,
        story_id: story&.id,
        # category_id: @visitors_filters['category'],
        # product_id: @visitors_filters['product']
      )
             .map { |result| result.attributes.values.compact }
             .map do |(group_unit, group_start_date, promote, link, search, other)|
               if @visitors_filters['show-visitor-source']
                 [group_unit, group_start_date, promote, link, search, other]
               else
                 [group_unit, group_start_date, promote + link + search + other]
               end
             end

    if story.nil?
      by_story =
        Visitor.to_company_by_story(
          @company.id,
          curator_id: curator&.id,
          start_date:,
          end_date:
        )
               .map { |result| result.attributes.values.compact }
               .map do |(customer, story_title, promote, link, search, other)|
                 story_record = @company.stories.find_by_title(story_title)
                 story_link = "<a href='#{story_record.csp_story_url}'>#{story_record.title}</a>"
                 if @visitors_filters['show-visitor-source']
                   [customer, story_link, promote, link, search, other]
                 else
                   [customer, story_link, promote + link + search + other]
                 end
               end
    end

    respond_to do |format|
      format.json do
        render json: { by_date: }.merge(story.present? ? {} : { by_story: })
      end
    end
  end

  private

  def is_demo?
    @company.subdomain == 'acme-test' and
      @curator&.email.in?([nil, 'rycwilson@gmail.com', 'acme-test@customerstories.net'])
  end

  def set_date_range(today)
    case @visitors_filters['date-range']
    when 'last-7'
      [today - 7.days, today]
    when 'last-30'
      [today - 30.days, today]
    when 'last-90'
      [today - 90.days, today]
    when 'this-quarter'
      [today.beginning_of_quarter, today]
    when 'previous-quarter'
      [today.beginning_of_quarter - 3.months, today.beginning_of_quarter - 1.day]
    when 'this-year'
      [today.beginning_of_year, today]
    when 'previous-year'
      [today.beginning_of_year - 1.year, today.beginning_of_year - 1.day]
    end
  end
end
