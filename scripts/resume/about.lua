function Pandoc(doc)
  local name, profile, body, avatar
  doc:walk({
    Image = function(image)
      if image.classes:includes("about-avatar") then avatar = image end
    end,
    Div = function(block)
      if block.classes:includes("resume-export-identity") then
        for _, child in ipairs(block.content) do
          if child.t == "Header" and child.level == 1 then name = child.content end
          if child.t == "Div" and child.classes:includes("profile-details") then
            profile = child.content
          end
        end
      elseif block.classes:includes("resume-export-body") then
        body = block.content
      end
    end
  })
  assert(name and profile and body, "Missing About name, profile or résumé body")

  local blocks = pandoc.List()
  if avatar then
    assert(avatar.src:match("^/[%w%-%._/]+$") and not avatar.src:find("..", 1, true), "Invalid avatar path")
    avatar.src = "dist" .. avatar.src
    blocks:insert(pandoc.RawBlock("latex", "\\begin{minipage}[t]{0.80\\textwidth}"))
  end
  blocks:insert(pandoc.Header(1, name, pandoc.Attr("resume-name")))
  for _, block in ipairs(profile) do
    if block.t == "BulletList" then
      local contacts = pandoc.List()
      for _, item in ipairs(block.content) do
        if #contacts > 0 then contacts:extend({pandoc.Space(), pandoc.Str("·"), pandoc.Space()}) end
        contacts:extend(item[1].content)
      end
      blocks:insert(pandoc.Para(contacts))
    else
      blocks:insert(block)
    end
  end
  if avatar then
    blocks:insert(pandoc.RawBlock("latex", "\\end{minipage}\\hfill\\begin{minipage}[t]{0.16\\textwidth}\\vspace{0pt}"))
    -- shortcut: assumes an avatar wider than 3:4, use cover scaling for narrower photos.
    blocks:insert(pandoc.RawBlock("latex", "\\begin{tikzpicture}[baseline=(current bounding box.north)]\\clip (0,0) rectangle (22mm,29.333mm);\\node[inner sep=0] at (11mm,14.6665mm) {\\includegraphics[height=29.333mm]{" .. avatar.src .. "}};\\end{tikzpicture}"))
    blocks:insert(pandoc.RawBlock("latex", "\\end{minipage}\\par\\medskip"))
  end
  blocks:extend(body)

  local url = pandoc.utils.stringify(doc.meta["resume-url"])
  local origin = url:match("^https?://[^/]+")
  return pandoc.Pandoc(blocks):walk({
    Link = function(link)
      local target = link.target
      if target:match("^//") then
        link.target = url:match("^https?:") .. target
      elseif target:match("^/") then
        link.target = origin .. target
      elseif not target:match("^[%a][%w+.-]*:") and not target:match("^#") then
        link.target = url .. target
      end
      return link
    end,
    Span = function(span)
      if span.classes:includes("resume-section-number") or span.attributes["aria-hidden"] == "true" then
        return {}
      end
    end,
  })
end
