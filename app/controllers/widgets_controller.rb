class WidgetsController < ApplicationController

  def index
    respond_to do |format|
      # format.html - might use this at some point
      format.js { render action: 'cs' }
      format.json {
        html = widget_html
        # Build a JSON object containing our HTML
        json = { html: html }.to_json
        # Get the name of the JSONP callback created by jQuery
        callback = params[:callback]
        # Wrap the JSON object with a call to the JSONP callback
        jsonp = callback + "(" + json + ")"
        # Send result to the browser
        render text: jsonp, content_type: "text/javascript"
      }
    end
  end

  protected

  def widget_html
    "<section class='drawer'>
      <header class='clickme'>Current Events</header>
      <div class='drawer-content'>
        <div class='drawer-items'>
          <ul>
            <li> <a href='#'>
              <div class='title'>Item 1</div>
              <div class='time'>8:00am</div>
              <div class='location'>Other Info</div>
            </a> </li>
            <li> <a href='#'>
              <div class='title'>Item 2</div>
              <div class='time'>8:00am</div>
              <div class='location'>Other Info</div>
            </a> </li>
            <li> <a href='#'>
              <div class='title'>Item 3</div>
              <div class='time'>8:00am</div>
              <div class='location'>Other Info</div>
            </a> </li>
            <li> <a href='#'>
              <div class='title'>Item 4</div>
              <div class='time'>8:00am</div>
              <div class='location'>Other Info</div>
            </a> </li>
          </ul>
        </div>
      </div>
    </section>"

    # "<section class='drawer'>
    #   <header class='clickme'>Customer Success Stories</header>
    #   <div class='drawer-content'>
    #     <div class='drawer-items'>
    #       <div class='row'>
    #         <div class='col-md-2'>
    #           <a href='#' class='thumbnail'>
    #             <img src='' alt=''>
    #           </a>
    #         </div>
    #         <div class='col-md-2'>
    #           <a href='#' class='thumbnail'>
    #             <img src='' alt=''>
    #           </a>
    #         </div>
    #         <div class='col-md-2'>
    #           <a href='#' class='thumbnail'>
    #             <img src='' alt=''>
    #           </a>
    #         </div>
    #         <div class='col-md-2'>
    #           <a href='#' class='thumbnail'>
    #             <img src='' alt=''>
    #           </a>
    #         </div>
    #         <div class='col-md-2'>
    #           <a href='#' class='thumbnail'>
    #             <img src='' alt=''>
    #           </a>
    #         </div>
    #         <div class='col-md-2'>
    #           <a href='#' class='thumbnail'>
    #             <img src='' alt=''>
    #           </a>
    #         </div>
    #       </div>
    #     </div>
    #   </div>
    # </section>"
  end

end